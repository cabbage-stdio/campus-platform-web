<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      class="device-search-form"
      v-show="showSearch"
      label-width="100px"
    >
      <el-form-item
        class="device-search-item"
        label="设备名称"
        prop="deviceName"
      >
        <el-input
          v-model="queryParams.deviceName"
          placeholder="请输入设备名称"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>

      <el-form-item class="device-search-item" label="设备类型" prop="modelId">
        <el-select
          v-model="queryParams.modelId"
          placeholder="请选择设备型号"
          clearable
        >
          <el-option
            v-for="dict in modelList"
            :key="dict.id"
            :label="dict.modelName"
            :value="dict.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        class="device-search-item"
        label="设备所属区域"
        prop="areaId"
      >
        <el-select
          v-model="queryParams.areaId"
          placeholder="请选择设备所属区域"
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
      <el-form-item class="device-search-item" label="设备状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="请选择设备状态"
          clearable
        >
          <el-option
            v-for="dict in campus_device_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item class="device-search-actions">
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
          v-hasPermi="['campus:device:add']"
          >新增</el-button
        >
      </el-col>
      <!-- <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="Edit"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['campus:device:edit']"
          >修改</el-button
        >
      </el-col> -->
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="Delete"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['campus:model:remove']"
          >删除</el-button
        >
      </el-col>
      <right-toolbar
        v-model:showSearch="showSearch"
        @queryTable="getList"
      ></right-toolbar>
    </el-row>

    <el-table
      v-loading="loading"
      :data="deviceList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="设备编号" align="center" prop="deviceCode">
        <template #default="scope">
          <el-button
            link
            @click="handleDetail(scope.row)"
            v-hasPermi="['campus:device:query']"
          >
            {{ scope.row.deviceCode }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="设备名称" align="center" prop="deviceName" />
      <el-table-column
        label="设备型号"
        align="center"
        prop="modelId"
        show-overflow-tooltip
      >
        <template #default="scope">
          {{ getModelName(scope.row.modelId) }}
        </template>
      </el-table-column>
      <el-table-column label="所属区域" align="center" prop="areaId">
        <template #default="scope">
          {{ getAreaName(scope.row.areaId) }}
        </template>
      </el-table-column>
      <el-table-column
        label="具体位置"
        align="center"
        prop="locationDetail"
        show-overflow-tooltip
      />
      <el-table-column label="设备状态" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="campus_device_status" :value="scope.row.status" />
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
            v-hasPermi="['campus:device:query']"
          >
            <svg-icon icon-class="eye-open" style="margin-right: 4px" />详情
          </el-button>

          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['campus:device:edit']"
            >修改</el-button
          >
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['campus:device:remove']"
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

    <!-- 添加或修改设备信息对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="deviceRef" :model="form" :rules="rules" label-width="120px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="设备名称" prop="deviceName">
              <el-input
                v-model="form.deviceName"
                placeholder="请输入设备名称"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备型号" prop="modelId">
              <el-select
                v-model="form.modelId"
                placeholder="请选择设备型号"
                clearable
              >
                <el-option
                  v-for="dict in modelList"
                  :key="dict.id"
                  :label="dict.modelName"
                  :value="dict.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="设备所属区域" prop="areaId">
              <el-select
                v-model="form.areaId"
                placeholder="请选择设备所属区域"
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
            <el-form-item label="具体位置" prop="locationDetail">
              <el-input
                v-model="form.locationDetail"
                placeholder="请输入具体位置"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in campus_device_status"
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

    <!-- 设备信息详情对话框 -->
    <el-dialog :title="title" v-model="detailOpen" width="500px" append-to-body>
      <el-form ref="deviceRef" :model="form" :rules="rules" label-width="120px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="设备编号:">
              <span>{{ form.deviceCode }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备名称:">
              <span>{{ form.deviceName }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备型号:">
              <span v-if="form.modelId">{{
                modelList.find((item) => item.id === form.modelId)?.modelName ||
                form.modelId
              }}</span>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="设备所属区域:">
              <span v-if="form.areaId">{{
                areaList.find((item) => item.id === form.areaId)?.areaName ||
                form.areaId
              }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="具体位置:">
              <span>{{ form.locationDetail }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备状态:">
              <span>{{
                campus_device_status.find((item) => item.value === form.status)
                  ?.label || form.status
              }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注:">
              <span>{{ form.remark }}</span>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="更新时间:">
              <span>{{ form.updateTime }}</span>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="创建者:">
              <span>{{ form.createBy }}</span>
            </el-form-item>
          </el-col>

          <el-col :span="24">
            <el-form-item label="创建时间:">
              <span>{{ form.createTime }}</span>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup name="Device">
import {
  listDevice,
  getDevice,
  delDevice,
  addDevice,
  updateDevice,
} from "@/api/campus/device";
import { listModel } from "@/api/campus/model";
import { listArea } from "@/api/campus/area";

const { proxy } = getCurrentInstance();
const { campus_device_status } = useDict("campus_device_status");

const deviceList = ref([]);
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
    deviceCode: undefined,
    deviceName: undefined,
    modelId: undefined,
    areaId: undefined,
    locationDetail: undefined,
    status: undefined,
  },
  rules: {
    deviceName: [
      { required: true, message: "设备名称不能为空", trigger: "blur" },
    ],
    modelId: [
      { required: true, message: "设备型号ID不能为空", trigger: "change" },
    ],
    areaId: [
      { required: true, message: "所属区域ID不能为空", trigger: "change" },
    ],
    locationDetail: [
      { required: true, message: "具体位置不能为空", trigger: "blur" },
    ],
    status: [
      { required: true, message: "0启用 1停用不能为空", trigger: "change" },
    ],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询设备信息列表 */
function getList() {
  loading.value = true;
  listDevice(queryParams.value).then((response) => {
    deviceList.value = response.rows;
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
    deviceCode: null,
    deviceName: null,
    modelId: null,
    areaId: null,
    locationDetail: null,
    status: null,
    remark: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
  };
  proxy.resetForm("deviceRef");
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
  title.value = "添加设备信息";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getDevice(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改设备信息";
  });
}

/** 详情按钮操作 */
const detailOpen = ref(false);

function handleDetail(row) {
  reset();
  const _id = row.id || ids.value;
  getDevice(_id).then((response) => {
    form.value = response.data;
    detailOpen.value = true;
    title.value = "设备信息详情";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["deviceRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updateDevice(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addDevice(form.value).then(() => {
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
    .confirm("是否确认删除设备？")
    .then(function () {
      return delDevice(_ids);
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
    "campus/device/export",
    {
      ...queryParams.value,
    },
    `device_${new Date().getTime()}.xlsx`,
  );
}

const modelList = ref([]);
const areaList = ref([]);

/** 查询设备型号列表 */
function getModelList() {
  listModel({ pageNum: 1, pageSize: 1000 }).then((response) => {
    modelList.value = response.rows;
  });
}

/** 根据设备型号id查询设备型号名称 */
function getModelName(modelId) {
  return modelList.value.find((item) => item.id === modelId)?.modelName || "-";
}

/** 查询校园区域列表 */
function getArea() {
  listArea({ pageNum: 1, pageSize: 1000 }).then((response) => {
    areaList.value = response.rows;
  });
}

function getAreaName(areaId) {
  return areaList.value.find((item) => item.id === areaId)?.areaName || "-";
}

getArea();
getModelList();
getList();
</script>

<style scoped>
.device-search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 16px 18px;
  margin-bottom: 16px;
  border-radius: 8px;
}

.device-search-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
}

.device-search-item {
  flex: 1 1 290px;
  min-width: 260px;
  max-width: 340px;
}

.device-search-item :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

.device-search-item :deep(.el-input),
.device-search-item :deep(.el-select) {
  width: 100%;
}

.device-search-form .device-search-actions {
  margin-left: auto;
}

@media (max-width: 768px) {
  .device-search-form {
    padding: 14px;
  }

  .device-search-item {
    flex-basis: 100%;
    min-width: 0;
    max-width: none;
  }

  .device-search-form .device-search-actions {
    margin-left: 0;
  }
}
</style>
