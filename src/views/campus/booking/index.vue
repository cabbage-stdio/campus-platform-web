<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="80px"
    >
      <el-form-item label="预约账号" prop="userName">
        <el-input
          v-model="queryParams.userName"
          placeholder="请输入账号或者学号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="座位编号" prop="seatCode">
        <el-input
          v-model="queryParams.seatCode"
          placeholder="请输入预约时的座位编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="预约日期" prop="bookingDate">
        <el-date-picker
          clearable
          v-model="queryParams.bookingDate"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="请选择预约日期"
        >
        </el-date-picker>
      </el-form-item>
      <el-form-item label="预约状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择预约状态"
          clearable
        >
          <el-option
            v-for="dict in campus_booking_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery"
          >搜索</el-button
        >
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['campus:booking:edit']"
          >修改</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['campus:booking:remove']"
          >删除</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['campus:booking:export']"
          >导出</el-button
        >
      </el-col>
      <right-toolbar
        v-model:showSearch="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="bookingList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />m
      <el-table-column label="预约账号" align="center" prop="userName" />
      <el-table-column label="预约用户" align="center" prop="nickName" />
      <el-table-column label="座位编号" align="center" prop="seatCode" />
      <el-table-column
        label="预约日期"
        align="center"
        prop="bookingDate"
        width="180"
      >
        <template #default="scope">
          <span>{{ parseTime(scope.row.bookingDate, "{y}-{m}-{d}") }}</span>
        </template>
      </el-table-column>
      <el-table-column label="预约状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag
            :options="campus_booking_status"
            :value="scope.row.status"
          />
        </template>
      </el-table-column>
      <el-table-column
        label="取消时间"
        align="center"
        prop="cancelTime"
        width="180"
      >
        <template #default="scope">
          <span>{{
            scope.row.cancelTime
              ? parseTime(scope.row.cancelTime, "{y}-{m}-{d}")
              : "--"
          }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="操作"
        align="center"
        class-name="small-padding fixed-width"
      >
        <template #default="scope">
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleDetail(scope.row)"
            v-hasPermi="['campus:booking:list']"
            >详情</el-button
          >
          <el-button
            v-if="String(scope.row.status) === '0'"
            v-hasPermi="['campus:booking:manage']"
            link
            type="danger"
            @click="handleAdminChange(scope.row, true)"
          >
            取消
          </el-button>

          <el-button
            v-hasPermi="['campus:booking:manage']"
            link
            type="primary"
            @click="handleAdminChange(scope.row, false)"
          >
            修改备注
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改座位预约对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form
        ref="bookingRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-row> </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog :title="title" v-model="detailOpen" width="500px" append-to-body>
      <el-form ref="detailRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="预约账号:">
              <span>{{ form.userName }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="预约用户:">
              <span>{{ form.nickName }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="座位编号:">
              <span>{{ form.seatCode }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="预约日期:">
              <span>{{ form.bookingDate }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="预约时段">
              <div v-if="form.items?.length">
                <div v-for="item in form.items" :key="item.id">
                  {{ getSlotLabel(item.slotNo) }}
                </div>
              </div>
              <span v-else>--</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="预约状态:">
              <span>{{
                campus_booking_status.find((item) => item.value === form.status)
                  ?.label || "-"
              }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="取消时间:">
              <span>{{
                form.cancelTime
                  ? parseTime(form.cancelTime, "{y}-{m}-{d}")
                  : "--"
              }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="取消原因:">
              <span>{{ form.cancelReason || "--" }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="创建时间:">
              <span>{{ form.createTime }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="创建人:">
              <span>{{ form.createBy }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="更新时间:">
              <span>{{ form.updateTime }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="更新人:">
              <span>{{ form.updateBy }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注:">
              <span>{{ form.remark || "--" }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup name="Booking">
import {
  listBooking,
  getBooking,
  delBooking,
  addBooking,
  updateBooking,
  adminCancelBooking,
  updateBookingRemark,
} from "@/api/campus/booking";

const { proxy } = getCurrentInstance();
const { campus_booking_status } = useDict("campus_booking_status");

const bookingList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const slotLabels = {
  1: "06:00–10:00",
  2: "10:00–14:00",
  3: "14:00–18:00",
  4: "18:00–22:00",
  5: "22:00–次日 00:00",
};

function getSlotLabel(slotNo) {
  return slotLabels[slotNo] ?? `时段 ${slotNo}`;
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    userId: undefined,
    seatCode: undefined,
    bookingDate: undefined,
    status: undefined,
  },
  rules: {},
});

const { queryParams, form, rules } = toRefs(data);

/** 查询座位预约列表 */
function getList() {
  loading.value = true;
  listBooking(queryParams.value).then((response) => {
    bookingList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 表单重置 */
function reset() {
  form.value = {
    id: null,
    userId: null,
    seatId: null,
    seatCode: null,
    bookingDate: null,
    status: null,
    cancelTime: null,
    cancelReason: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
    remark: null,
  };
  proxy.resetForm("bookingRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

/** 多选框选中数据 */
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加座位预约";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getBooking(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改座位预约";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["bookingRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updateBooking(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addBooking(form.value).then(() => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal
    .confirm('是否确认删除座位预约编号为"' + _ids + '"的数据项？')
    .then(function () {
      return delBooking(_ids);
    })
    .then(() => {
      getList();
      proxy.$modal.msgSuccess("删除成功");
    })
    .catch(() => {});
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download(
    "campus/booking/export",
    {
      ...queryParams.value,
    },
    `booking_${new Date().getTime()}.xlsx`,
  );
}

const detailOpen = ref(false);

/** 查看详情按钮操作 */
function handleDetail(row) {
  reset();
  const _id = row.id || ids.value;
  getBooking(_id).then((response) => {
    form.value = response.data;
    detailOpen.value = true;
    title.value = "查看座位预约详情";
  });
}

async function handleAdminChange(row, isCancel) {
  let result;
  try {
    result = await proxy.$modal.prompt(
      isCancel
        ? "请输入取消原因，确认后将释放座位"
        : "请输入新备注，留空可清除",
    );
  } catch {
    return;
  }

  const text = (result.value ?? "").trim();
  if (text.length > 200 || (isCancel && !text)) {
    proxy.$modal.msgWarning(
      isCancel ? "请填写取消原因，最多200字" : "备注最多200字",
    );
    return;
  }

  if (isCancel) {
    await adminCancelBooking(row.id, text);
  } else {
    await updateBookingRemark(row.id, text);
  }

  proxy.$modal.msgSuccess(isCancel ? "已取消预约" : "备注已更新");
  getList();
}

getList();
</script>
