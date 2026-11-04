<template>
  <div class="app-container">
    <el-form
      :model="queryParams"
      ref="queryRef"
      :inline="true"
      class="model-search-form"
      v-show="showSearch"
      label-width="100px"
    >
      <el-form-item label="设备分类" prop="deviceType">
        <el-select
          v-model="queryParams.deviceType"
          placeholder="请选择设备分类"
          clearable
        >
          <el-option
            v-for="dict in campus_device_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="品牌/厂商" prop="manufacturer">
        <el-input
          v-model="queryParams.manufacturer"
          placeholder="请输入品牌或厂商"
          clearable
          @keyup.enter="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择" clearable>
          <el-option
            v-for="dict in campus_device_status"
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
          v-hasPermi="['campus:model:add']"
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
          v-hasPermi="['campus:model:edit']"
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
      :data="modelList"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column
        label="型号名称"
        align="center"
        prop="modelName"
        width="250px"
      />
      <el-table-column label="型号" align="center" prop="modelCode" />
      <el-table-column
        label="品牌/厂商"
        align="center"
        prop="manufacturer"
        show-overflow-tooltip
        width="200px"
      />
      <el-table-column
        label="设备分类"
        align="center"
        prop="deviceType"
        width="120px"
      >
        <template #default="scope">
          <dict-tag
            :options="campus_device_type"
            :value="scope.row.deviceType"
          />
        </template>
      </el-table-column>
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
            v-hasPermi="['campus:model:detail']"
          >
            <svg-icon icon-class="eye-open" style="margin-right: 4px" />详情
          </el-button>
          <el-button
            link
            type="primary"
            icon="Edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['campus:model:edit']"
            >修改</el-button
          >
          <el-button
            link
            type="primary"
            icon="Delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['campus:model:remove']"
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

    <!-- 添加或修改设备型号对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="modelRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="品牌或厂商" prop="manufacturer">
              <el-input
                v-model="form.manufacturer"
                placeholder="请输入品牌或厂商"
              />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="厂商型号" prop="modelCode">
              <el-input v-model="form.modelCode" placeholder="请输入厂商型号" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="型号名称" prop="modelName">
              <el-input v-model="form.modelName" placeholder="请输入型号名称" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备分类" prop="deviceType">
              <el-select v-model="form.deviceType" placeholder="请选择设备分类">
                <el-option
                  v-for="dict in campus_device_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
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

    <!-- 设备型号详情对话框 -->
    <el-dialog :title="title" v-model="detailOpen" width="500px" append-to-body>
      <el-form ref="modelRef" :model="form" :rules="rules" label-width="100px">
        <el-row>
          <el-col :span="24">
            <el-form-item label="品牌或厂商:">
              <span>{{ form.manufacturer }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="厂商型号:">
              <span>{{ form.modelCode }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="型号名称:">
              <span>{{ form.modelName }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备分类:">
              <span v-if="form.deviceType">{{
                campus_device_type.find(
                  (item) => item.value === form.deviceType,
                )?.label
              }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="设备状态:">
              <span v-if="form.status">{{
                campus_device_status.find((item) => item.value === form.status)
                  ?.label
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

<script setup name="Model">
import {
  listModel,
  getModel,
  delModel,
  addModel,
  updateModel,
} from "@/api/campus/model";

const { proxy } = getCurrentInstance();
const { campus_device_type, campus_device_status } = useDict(
  "campus_device_type",
  "campus_device_status",
);

const modelList = ref([]);
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
    manufacturer: undefined,
    modelCode: undefined,
    modelName: undefined,
    deviceType: undefined,
    status: undefined,
  },
  rules: {
    manufacturer: [
      { required: true, message: "品牌或厂商不能为空", trigger: "blur" },
    ],
    modelCode: [
      { required: true, message: "厂商型号不能为空", trigger: "blur" },
    ],
    modelName: [
      { required: true, message: "型号名称不能为空", trigger: "blur" },
    ],
    deviceType: [
      {
        required: true,
        message: "设备分类，使用系统字典不能为空",
        trigger: "change",
      },
    ],
    status: [
      { required: true, message: "0启用 1停用不能为空", trigger: "change" },
    ],
  },
});

const { queryParams, form, rules } = toRefs(data);

/** 查询设备型号列表 */
function getList() {
  loading.value = true;
  listModel(queryParams.value).then((response) => {
    modelList.value = response.rows;
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
    manufacturer: null,
    modelCode: null,
    modelName: null,
    deviceType: null,
    status: null,
    remark: null,
    createBy: null,
    createTime: null,
    updateBy: null,
    updateTime: null,
  };
  proxy.resetForm("modelRef");
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
  title.value = "添加设备型号";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value;
  getModel(_id).then((response) => {
    form.value = response.data;
    open.value = true;
    title.value = "修改设备型号";
  });
}

const detailOpen = ref(false);

/** 详情按钮操作 */
function handleDetail(row) {
  reset();
  const _id = row.id || ids.value;
  getModel(_id).then((response) => {
    form.value = response.data;
    detailOpen.value = true;
    title.value = "设备型号详情";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["modelRef"].validate((valid) => {
    if (valid) {
      if (form.value.id != null) {
        updateModel(form.value).then(() => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addModel(form.value).then(() => {
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
    .confirm('是否确认删除设备型号编号为"' + _ids + '"的数据项？')
    .then(function () {
      return delModel(_ids);
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
    "campus/model/export",
    {
      ...queryParams.value,
    },
    `model_${new Date().getTime()}.xlsx`,
  );
}

getList();
</script>

<style scoped>
.model-search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 16px;
  padding: 16px 18px;
  margin-bottom: 16px;
  border-radius: 8px;
}

.model-search-form :deep(.el-form-item) {
  margin-right: 0;
  margin-bottom: 0;
}

.model-search-item {
  flex: 1 1 290px;
  min-width: 260px;
  max-width: 340px;
}

.model-search-item :deep(.el-form-item__content) {
  flex: 1;
  min-width: 0;
}

.model-search-item :deep(.el-input),
.model-search-item :deep(.el-select) {
  width: 100%;
}

.model-search-form .model-search-actions {
  margin-left: auto;
}

@media (max-width: 768px) {
  .model-search-form {
    padding: 14px;
  }

  .model-search-item {
    flex-basis: 100%;
    min-width: 0;
    max-width: none;
  }

  .model-search-form .model-search-actions {
    margin-left: 0;
  }
}
</style>
