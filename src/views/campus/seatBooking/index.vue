<template>
  <div class="booking-page">
    <!-- 顶部筛选栏 -->
    <el-form :inline="true" class="filter-bar" :model="queryParams">
      <el-form-item label="楼层">
        <el-select
          v-model="queryParams.floorNo"
          style="width: 120px"
          @change="handleQuery"
        >
          <el-option
            v-for="floor in [1, 2, 3, 4]"
            :key="floor"
            :label="`${floor} 层`"
            :value="floor"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="预约日期">
        <el-date-picker
          v-model="queryParams.bookingDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择日期"
          :clearable="false"
          :disabled-date="disabledBookingDate"
          @change="handleDateChange"
        />
      </el-form-item>

      <el-form-item label="预约时段">
        <el-select
          v-model="queryParams.slotNos"
          multiple
          collapse-tags
          collapse-tags-tooltip
          :max-collapse-tags="3"
          placeholder="请选择时段"
          style="width: 440px"
        >
          <el-option
            v-for="slot in timeSlots"
            :key="slot.no"
            :label="slot.label"
            :value="slot.no"
            :disabled="isSlotExpired(slot.no, queryParams.bookingDate)"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
        <el-button type="primary" plain @click="openMyBookings">
          我的预约
        </el-button>
      </el-form-item>
    </el-form>

    <div class="map-header">
      <strong>
        {{ queryParams.floorNo }} 层座位分布 · {{ seats.length }} 个座位
      </strong>
      <span>白色：可选　灰色：占用　橙色：部分时段占用　</span>
    </div>

    <!-- 小屏幕横向滚动，保留座位布局 -->
    <div class="map-scroll" v-loading="loading">
      <div class="floor-map">
        <section
          v-for="zone in seatZones"
          :key="zone.key"
          class="seat-zone"
          :class="{ 'window-zone': zone.key === 'window' }"
        >
          <div class="zone-title">{{ zone.name }}</div>

          <div
            class="seat-grid"
            :class="{ 'window-grid': zone.key === 'window' }"
          >
            <button
              v-for="seat in zone.seats"
              :key="seat.id"
              type="button"
              class="seat"
              :class="[
                getSeatState(seat),
                { selected: selectedSeat?.id === seat.id },
              ]"
              :aria-label="seat.seatCode"
              :title="seat.seatCode"
              :disabled="isSeatDisabled(seat)"
              @click="showSeatDetail(seat)"
            >
              {{ seat.label }}
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- 座位预约详情弹窗 -->
    <el-dialog
      v-model="detailOpen"
      title="座位预约"
      width="560px"
      style="max-width: 95vw"
      :close-on-click-modal="false"
      :close-on-press-escape="submittingSlotNo === null"
      :show-close="submittingSlotNo === null"
    >
      <template v-if="selectedSeat">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="座位编号">
            {{ selectedSeat.seatCode }}
          </el-descriptions-item>

          <el-descriptions-item label="楼层">
            {{ selectedSeat.floorNo }} 层
          </el-descriptions-item>

          <el-descriptions-item label="预约日期">
            {{ detailBookingDate }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 上面的小框：当前登录人 -->
        <div class="booking-user">
          <div class="section-title">预约人信息</div>
          <div>昵称：{{ userStore.nickName || userStore.name }}</div>
          <div>账号：{{ userStore.name }}</div>
        </div>

        <!-- 下面的大框：五个时段 -->
        <div class="booking-slots">
          <div class="section-title">预约时段</div>

          <div
            v-for="slot in timeSlots"
            :key="slot.no"
            class="slot-row"
            :class="{ 'slot-unavailable': isSlotDisabled(slot.no) }"
          >
            <span>{{ slot.label }}</span>

            <el-button
              v-hasPermi="['campus:booking:add']"
              type="primary"
              size="small"
              :loading="submittingSlotNo === slot.no"
              :disabled="isSlotDisabled(slot.no) || submittingSlotNo !== null"
              @click="createBookingSeat(slot.no)"
            >
              {{
                String(selectedSeat.status) !== "0"
                  ? "已停用"
                  : isSlotExpired(slot.no, detailBookingDate)
                    ? "已结束"
                    : isSlotOccupied(slot.no)
                      ? "已预约"
                      : "预约"
              }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 我的预约弹窗 -->
    <el-dialog
      v-model="myBookingsOpen"
      title="我的预约"
      width="950px"
      style="max-width: 95vw"
      :close-on-click-modal="false"
    >
      <el-button
        icon="Refresh"
        :disabled="myBookingsLoading || cancellingBookingId !== null"
        @click="getMyBookingList"
        style="margin-bottom: 16px"
      >
        刷新
      </el-button>

      <el-table
        v-loading="myBookingsLoading"
        :data="myBookingList"
        row-key="id"
        border
        empty-text="暂无预约记录"
      >
        <el-table-column prop="seatCode" label="座位编号" min-width="150" />

        <el-table-column prop="bookingDate" label="预约日期" width="120" />

        <el-table-column label="预约时段" min-width="190">
          <template #default="{ row }">
            <div v-for="item in row.items || []" :key="item.id">
              {{ getMySlotLabel(item.slotNo) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="String(row.status) === '0' ? 'success' : 'info'">
              {{ String(row.status) === "0" ? "已确认" : "已取消" }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="cancelReason"
          label="取消原因"
          min-width="140"
          show-overflow-tooltip
        />

        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              :loading="cancellingBookingId === row.id"
              :disabled="
                !row.canCancel ||
                myBookingsLoading ||
                cancellingBookingId !== null
              "
              @click="handleCancelMyBooking(row)"
            >
              取消预约
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="myBookingsTotal > 0"
        v-model:page="myBookingQuery.pageNum"
        v-model:limit="myBookingQuery.pageSize"
        :total="myBookingsTotal"
        :auto-scroll="false"
        @pagination="getMyBookingList"
      />
    </el-dialog>
  </div>
</template>

<script setup name="SeatBooking">
import {
  getBookingSeats,
  addBookingSeat,
  listMyBookings,
  cancelMyBooking,
} from "@/api/campus/seatBooking";
import { computed, ref, reactive, onMounted, onUnmounted } from "vue";
import useUserStore from "@/store/modules/user";
import { ElMessageBox } from "element-plus";

const { proxy } = getCurrentInstance();

const detailOpen = ref(false);
const selectedSeat = ref(null);

const seats = ref([]);
const loading = ref(false);

const userStore = useUserStore();

// 当前正在提交的时段编号，null 表示没有提交
const submittingSlotNo = ref(null);

// 打开弹窗时记录预约日期
const detailBookingDate = ref("");
// 现在的时间
const currentTime = ref(Date.now());

let clockTimer;
// 定时更新当前时间
onMounted(() => {
  clockTimer = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  clearInterval(clockTimer);
});

const timeSlots = [
  { no: 1, label: "06:00～10:00", endHour: 10 },
  { no: 2, label: "10:00～14:00", endHour: 14 },
  { no: 3, label: "14:00～18:00", endHour: 18 },
  { no: 4, label: "18:00～22:00", endHour: 22 },
  { no: 5, label: "22:00～次日00:00", endHour: 24 },
];

// 定义每个分区包含哪些布局位置。
// layoutNo 是摆放位置编号，不是数据库主键。
const zoneConfigs = [
  { key: "window", name: "靠窗区", start: 1, end: 14 },
  { key: "group1", name: "桌组一", start: 15, end: 26 },
  { key: "group2", name: "桌组二", start: 27, end: 38 },
  { key: "group3", name: "桌组三", start: 39, end: 50 },
  { key: "group4", name: "桌组四", start: 51, end: 62 },
  { key: "group5", name: "桌组五", start: 63, end: 74 },
  { key: "group6", name: "桌组六", start: 75, end: 86 },
];

const queryParams = reactive({
  areaId: 6, //区域ID
  floorNo: 1, // 默认一楼
  bookingDate: getToday(), // 预约日期
  slotNos: getSlotNos(getToday()), // 预约时段
});

function getSlotNos(bookingDate) {
  return timeSlots
    .filter((slot) => !isSlotExpired(slot.no, bookingDate))
    .map((slot) => slot.no);
}

// 避免快速切换楼层时，较早的请求覆盖最新结果
let requestNo = 0;

async function getSeatList() {
  const currentNo = ++requestNo;

  resetSelection();
  seats.value = [];

  if (!queryParams.bookingDate) {
    loading.value = false;
    proxy.$message.error("请先选择预约日期");
    return;
  }

  loading.value = true;

  try {
    const response = await getBookingSeats({
      areaId: queryParams.areaId,
      floorNo: queryParams.floorNo,
      bookingDate: queryParams.bookingDate,
    });

    if (currentNo !== requestNo) {
      return;
    }

    seats.value = response.data.map((seat) => {
      const label = seat.seatCode.split("-").pop();

      return {
        ...seat,
        label,
        layoutNo: Number(label.slice(1)),
        occupiedSlotNos: (seat.occupiedSlotNos || []).map(Number),
      };
    });
  } catch (error) {
    if (currentNo === requestNo) {
      seats.value = [];
    }
  } finally {
    if (currentNo === requestNo) {
      loading.value = false;
    }
  }
}

// 将座位分配到对应分区，并按布局位置排序。
const seatZones = computed(() =>
  zoneConfigs.map((zone) => ({
    ...zone,
    seats: seats.value
      .filter(
        (seat) => seat.layoutNo >= zone.start && seat.layoutNo <= zone.end,
      )
      .sort((a, b) => a.layoutNo - b.layoutNo),
  })),
);

// 获取座位状态
function getSeatState(seat) {
  //停用优先
  if (String(seat.status) !== "0") {
    return "disabled";
  }

  const selected = queryParams.slotNos.map(Number);

  if (selected.length === 0) {
    return "unselected";
  }

  const occupied = new Set(seat.occupiedSlotNos);

  const conflictCount = selected.filter((slotNo) =>
    occupied.has(slotNo),
  ).length;

  if (conflictCount === 0) {
    return "available";
  }

  return conflictCount === selected.length ? "occupied" : "partial";
}

// 预约座位
async function createBookingSeat(slotNo) {
  currentTime.value = Date.now();

  if (submittingSlotNo.value !== null || isSlotDisabled(slotNo)) {
    return;
  }

  const data = {
    seatId: selectedSeat.value.id,
    bookingDate: queryParams.bookingDate,
    slotNos: [slotNo],
  };

  submittingSlotNo.value = slotNo;

  try {
    await addBookingSeat(data);
  } catch (error) {
    await getSeatList();
    return;
  } finally {
    submittingSlotNo.value = null;
  }

  proxy.$message.success("预约成功");

  await getSeatList();
}

// 点击座位显示详情
function showSeatDetail(seat) {
  selectedSeat.value = seat;
  detailBookingDate.value = queryParams.bookingDate;
  detailOpen.value = true;
}

// 清除选中座位、关闭详情框
function resetSelection() {
  selectedSeat.value = null;
  detailOpen.value = false;
}

// 搜索按钮操作
function handleQuery() {
  getSeatList();
}
// 日期选择器改变时的操作
function handleDateChange() {
  // 更新当前时间
  currentTime.value = Date.now();

  // 根据新日期，重新选中所有尚未结束的时段
  queryParams.slotNos = getSlotNos(queryParams.bookingDate);

  // 查询新日期的座位占用情况
  handleQuery();
}

// 重置按钮操作
function resetQuery() {
  ++requestNo;

  queryParams.floorNo = 1;
  queryParams.bookingDate = getToday();
  queryParams.slotNos = getSlotNos(getToday());

  seats.value = [];
  loading.value = false;

  resetSelection(); //清除选中座位、关闭详情框
  handleQuery();
}

// 判断当前座位的某个时段是否已经被预约
function isSlotOccupied(slotNo) {
  const occupiedSlotNos = selectedSeat.value.occupiedSlotNos || [];

  return occupiedSlotNos.includes(Number(slotNo));
}

// 已停用的座位，或者已占用的时段，都不能预约
function isSlotDisabled(slotNo) {
  if (!selectedSeat.value) {
    return true;
  }

  return (
    String(selectedSeat.value.status) !== "0" ||
    isSlotOccupied(slotNo) ||
    isSlotExpired(slotNo, detailBookingDate.value)
  );
}
// 获取当前日期
function getToday() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSeatDisabled(seat) {
  if (String(seat.status) !== "0") {
    return false;
  }
}

function isSlotExpired(slotNo, bookingDate) {
  if (!bookingDate) {
    return true;
  }

  const slot = timeSlots.find((item) => item.no === Number(slotNo));

  if (!slot) {
    return true;
  }

  // 预约日期当天零点，按北京时间计算
  const dayStart = Date.parse(`${bookingDate}T00:00:00+08:00`);

  if (Number.isNaN(dayStart)) {
    return true;
  }

  // 当天零点 + 结束小时 = 这个时段的结束时间
  const endTime = dayStart + slot.endHour * 60 * 60 * 1000;

  return endTime <= currentTime.value;
}

function disabledBookingDate(date) {
  const now = new Date(currentTime.value);

  // 今天零点
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 22点前开放到后天，22点起开放到大后天
  const maxDays = now.getHours() >= 22 ? 3 : 2;

  // 最晚可选日期
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + maxDays);

  // 日历中正在判断的日期，统一为零点
  const targetDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  // true 表示禁用，false 表示允许选择
  return targetDate < today || targetDate > maxDate;
}

// 我的预约弹窗
const myBookingsOpen = ref(false);

// 列表数据、加载状态和总条数
const myBookingList = ref([]);
const myBookingsLoading = ref(false);
const myBookingsTotal = ref(0);

// 分页参数，和上面座位查询的 queryParams 分开
const myBookingQuery = reactive({
  pageNum: 1,
  pageSize: 10,
});

// 当前正在取消的预约 ID
const cancellingBookingId = ref(null);

// 防止快速翻页时，旧请求覆盖新结果
let myBookingRequestNo = 0;

function openMyBookings() {
  myBookingsOpen.value = true;
  myBookingQuery.pageNum = 1;
  getMyBookingList();
}

// 获取我的预约列表
async function getMyBookingList() {
  const currentNo = ++myBookingRequestNo;
  myBookingsLoading.value = true;

  try {
    const response = await listMyBookings({
      pageNum: myBookingQuery.pageNum,
      pageSize: myBookingQuery.pageSize,
    });

    if (currentNo !== myBookingRequestNo) {
      return;
    }

    myBookingList.value = response.rows || [];
    myBookingsTotal.value = response.total || 0;
  } catch (error) {
    // 项目的 request.js 已经统一显示错误提示
    if (currentNo === myBookingRequestNo) {
      myBookingList.value = [];
      myBookingsTotal.value = 0;
    }
  } finally {
    if (currentNo === myBookingRequestNo) {
      myBookingsLoading.value = false;
    }
  }
}

// 复用当前页面已有的 timeSlots 数组
function getMySlotLabel(slotNo) {
  const slot = timeSlots.find((item) => item.no === Number(slotNo));

  return slot ? slot.label : `时段 ${slotNo}`;
}

// 取消我的预约
async function handleCancelMyBooking(row) {
  if (!row.canCancel || cancellingBookingId.value !== null) {
    return;
  }

  cancellingBookingId.value = row.id;

  try {
    let cancelReason;

    // 第一步：让用户确认，并填写可选的取消原因
    try {
      const { value } = await ElMessageBox.prompt(
        `确定取消 ${row.seatCode} 在 ${row.bookingDate} 的预约吗？`,
        "取消预约",
        {
          confirmButtonText: "确定取消预约",
          cancelButtonText: "暂不取消",
          inputType: "textarea",
          inputPlaceholder: "取消原因（选填，最多200个字符）",
          closeOnClickModal: false,
          inputValidator: (value) => {
            return (value || "").length <= 200 || "取消原因不能超过200个字符";
          },
        },
      );

      cancelReason = (value || "").trim();
    } catch {
      // 关闭弹窗或点击“暂不取消”，不发送请求
      return;
    }

    // 第二步：调用后端取消接口
    try {
      await cancelMyBooking(row.id, {
        cancelReason,
      });
    } catch (error) {
      // 后端可能提示时段已结束、预约已取消等
      // 错误由 request.js 显示，再刷新列表中的状态
      await getMyBookingList();
      return;
    }

    proxy.$message.success("取消预约成功");

    // 第三步：更新预约列表和座位颜色
    await Promise.all([getMyBookingList(), getSeatList()]);
  } finally {
    cancellingBookingId.value = null;
  }
}

getSeatList();
</script>

<style scoped>
.booking-page {
  padding: 20px;
}

.filter-bar {
  padding: 20px 20px 0;
  background: #fff;
  border-radius: 8px;
}

.map-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin: 20px 0;
}

.map-header span {
  color: #606266;
  font-size: 13px;
}

.map-scroll {
  overflow-x: auto;
  background: #f5f7fa;
  border-radius: 12px;
}

.floor-map {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 32px 24px;
  min-width: 960px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  box-sizing: border-box;
}

.seat-zone {
  padding: 20px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 12px;
  background: #eef1f5;
}

.window-zone {
  grid-column: 1 / -1;
}

.zone-title {
  margin-bottom: 16px;
  text-align: center;
  color: #606266;
  font-size: 14px;
}

.seat-grid {
  display: grid;
  grid-template-columns: repeat(4, 46px);
  justify-content: center;
  gap: 18px 16px;
}

.window-grid {
  grid-template-columns: repeat(14, 46px);
  gap: 12px;
}

.seat {
  width: 46px;
  height: 46px;
  padding: 0;
  border: 1px solid #b8bec8;
  border-radius: 10px;
  background: #fff;
  color: #303133;
  cursor: pointer;
}

.seat:hover {
  border-color: #409eff;
}

.seat.occupied {
  background: #dcdfe6;
}

.seat.partial {
  background: #ffe3b0;
}

.seat.disabled {
  background: #909399;
  color: #fff;
}

.seat.selected {
  outline: 2px solid #409eff;
  outline-offset: 3px;
}

.booking-user,
.booking-slots {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
}

.booking-user {
  background: #f5f7fa;
  line-height: 28px;
}

.section-title {
  margin-bottom: 12px;
  color: #303133;
  font-weight: bold;
}

.slot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
}

.slot-row:last-child {
  margin-bottom: 0;
}

/* 已预约或停用的时段变暗 */
.slot-row.slot-unavailable {
  background: #dcdfe6;
  color: #73767a;
}

/* 页面文字 */
.booking-page {
  color: var(--el-text-color-primary);
}

/* 搜索区域 */
.filter-bar {
  background: var(--el-bg-color);
}

/* 座位地图背景 */
.map-scroll {
  background: var(--el-bg-color-page);
}

/* 各个座位分区 */
.seat-zone {
  background: var(--el-fill-color-light);
  border-color: var(--el-border-color);
}

/* 说明文字 */
.map-header span,
.zone-title {
  color: var(--el-text-color-regular);
}

/* 普通座位 */
.seat {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  border-color: var(--el-border-color);
}

.seat:hover {
  border-color: var(--el-color-primary);
}

/* 已占用 */
.seat.occupied {
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-secondary);
}

/* 部分时段占用 */
.seat.partial {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
  border-color: var(--el-color-warning-light-5);
}

/* 停用 */
.seat.disabled {
  background: var(--el-fill-color-darker);
  color: var(--el-text-color-placeholder);
  border-color: var(--el-border-color);
}

/* 当前选中座位 */
.seat.selected {
  outline-color: var(--el-color-primary);
}

/* 弹窗里的信息框 */
.booking-user,
.booking-slots {
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}

.booking-user {
  background: var(--el-fill-color-light);
}

.section-title {
  color: var(--el-text-color-primary);
}

/* 可预约的时段 */
.slot-row {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  border-color: var(--el-border-color);
}

/* 已结束、已预约等不可用时段 */
.slot-row.slot-unavailable {
  background: var(--el-fill-color-dark);
  color: var(--el-text-color-secondary);
}
</style>
