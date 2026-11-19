<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      v-show="showSearch"
      label-width="68px"
    >
      <el-form-item label="所属楼栋" prop="areaId">
        <el-select
          v-model="queryParams.areaId"
          placeholder="请选择楼栋"
          clearable
        >
          <el-option
            v-for="dict in areaList"
            :key="dict.id"
            :label="dict.areaName"
            :value="dict.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="楼层" prop="floorNo">
        <el-select
          v-model="queryParams.floorNo"
          placeholder="请选择楼层"
          clearable
        >
          <el-option
            v-for="dict in campus_floor"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="座位编号" prop="seatCode">
        <el-input
          v-model="queryParams.seatCode"
          placeholder="请输入座位编号"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择状态"
          clearable
        >
          <el-option
            v-for="dict in common_status"
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
          type="primary"
          plain
          icon="Plus"
          @click="handleAdd"
          v-hasPermi="['campus:seat:add']"
          >新增</el-button
        >
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['campus:seat:remove']"
          >删除</el-button
        >
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="Download"
          @click="handleExport"
          v-hasPermi="['campus:seat:export']"
        >导出</el-button>
      </el-col> -->
      <right-toolbar
        v-model:showSearch="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="seatList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="座位编号" align="center" prop="seatCode">
        <template #default="scope">
          <el-button
            link
            @click="handleDetail(scope.row)"
            v-hasPermi="['campus:device:query']"
            >{{ scope.row.seatCode }}</el-button
          >
        </template>
      </el-table-column>
      <el-table-column label="所属楼栋" align="center" prop="areaId">
        <template #default="scope">
          {{ getAreaName(scope.row.areaId) }}
        </template>
      </el-table-column>
      <el-table-column label="楼层" align="center" prop="floorNo">
        <template #default="scope">
          <dict-tag :options="campus_floor" :value="scope.row.floorNo" />
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="common_status" :value="scope.row.status" />
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
            @click="handleDetail(scope.row)"
            v-hasPermi="['campus:seat:query']"
          >
            <svg-icon icon-class="eye-open" style="margin-right: 4px" />详情
          </el-button>
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['campus:seat:edit']"
            >修改</el-button
          >
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['campus:seat:remove']"
            >删除</el-button
          >
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

    <!-- 添加或修改座位管理对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="seatRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="所属楼栋" prop="areaId">
              <el-select
                v-model="form.areaId"
                placeholder="请选择楼栋"
                clearable
              >
                <el-option
                  v-for="dict in areaList"
                  :key="dict.id"
                  :label="dict.areaName"
                  :value="dict.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="楼层" prop="floorNo">
              <el-select v-model="form.floorNo" placeholder="请选择楼层">
                <el-option
                  v-for="dict in campus_floor"
                  :key="dict.value"
                  :label="dict.label"
                  :value="parseInt(dict.value)"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <!-- <el-col :span="24">
            <el-form-item label="座位编号" prop="seatCode">
              <el-input v-model="form.seatCode" placeholder="请输入座位编号" />
            </el-form-item>
          </el-col> -->
          <el-col :span="24">
            <el-form-item label="具体位置" prop="locationDetail">
              <el-input
                v-model="form.locationDetail"
                placeholder="请输入具体位置"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in common_status"
                  :key="dict.value"
                  :label="dict.value"
                  >{{ dict.label }}</el-radio
                >
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="form.remark"
                type="textarea"
                placeholder="请输入内容"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情 -->
    <el-dialog :title="title" v-model="detailOpen" width="500px" append-to-body>
      <el-form :model="form" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="所属楼栋">
              <span>{{ getAreaName(form.areaId) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="楼层">
              <span>{{ getFloorName(form.floorNo) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="座位编号">
              <span>{{ form.seatCode || "-" }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="状态">
              <span>{{
                common_status.find((item) => item.value === form.status)
                  ?.label || "-"
              }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="具体位置">
              <span>{{ form.locationDetail || "-" }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注">
              <span>{{ form.remark || "-" }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup name="Seat">
import {
  listSeat,
  getSeat,
  delSeat,
  addSeat,
  updateSeat,
} from "@/api/campus/seat";
import { listArea } from "@/api/campus/area";
import { ElButton } from "element-plus";

const { proxy } = getCurrentInstance();
const { common_status, campus_floor } = useDict(
  "common_status",
  "campus_floor",
);

const seatList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    areaId: undefined,
    floorNo: undefined,
    seatCode: undefined,
    status: undefined,
  },
  rules: {
    areaId: [{ required: true, message: "所属楼栋不能为空", trigger: "blur" }],
    floorNo: [{ required: true, message: "楼层不能为空", trigger: "change" }],
    status: [{ required: true, message: "状态不能为空", trigger: "change" }],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询座位管理列表 */
function getList() {
  loading.value = true;
  listSeat(queryParams.value).then((response) => {
    seatList.value = response.rows;
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
    areaId: null,
    floorNo: null,
    seatCode: null,
    locationDetail: null,
    status: null,
    remark: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
  };
  proxy.resetForm("seatRef");
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
  title.value = "添加座位管理";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getSeat(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改座位管理";
  });
}

const detailOpen = ref(false);

/** 查看详情 */
function handleDetail(row) {
  reset();
  const _id = row.id || ids.value;
  getSeat(_id).then((response) => {
    form.value = response.data;
    detailOpen.value = true;
    title.value = "查看座位管理详情";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["seatRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updateSeat(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addSeat(form.value).then(() => {
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
    .confirm("是否确认删除座位？")
    .then(function () {
      return delSeat(_ids);
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
    "campus/seat/export",
    {
      ...queryParams.value,
    },
    `seat_${new Date().getTime()}.xlsx`,
  );
}

const areaList = ref([]);

/** 查询楼栋列表 */
function getAreaList() {
  listArea().then((response) => {
    areaList.value = response.rows;
  });
}

/** 查询楼栋名称 */
function getAreaName(areaId) {
  return areaList.value.find((item) => item.id === areaId)?.areaName || "-";
}

/** 查询楼层名称 */
function getFloorName(floorNo) {
  return (
    campus_floor.value.find((item) => item.value === String(floorNo))?.label ||
    "-"
  );
}

getAreaList();
getList();
</script>
