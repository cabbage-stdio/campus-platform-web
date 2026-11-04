import request from '@/utils/request'

// 查询设备型号列表
export function listModel(query) {
  return request({
    url: '/campus/model/list',
    method: 'get',
    params: query
  })
}

// 查询设备型号详细
export function getModel(id) {
  return request({
    url: '/campus/model/' + id,
    method: 'get'
  })
}

// 新增设备型号
export function addModel(data) {
  return request({
    url: '/campus/model',
    method: 'post',
    data: data
  })
}

// 修改设备型号
export function updateModel(data) {
  return request({
    url: '/campus/model',
    method: 'put',
    data: data
  })
}

// 删除设备型号
export function delModel(id) {
  return request({
    url: '/campus/model/' + id,
    method: 'delete'
  })
}
