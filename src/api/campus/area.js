import request from '@/utils/request'

// 查询校园区域列表
export function listArea(query) {
  return request({
    url: '/campus/area/list',
    method: 'get',
    params: query
  })
}

// 查询校园区域详细
export function getArea(id) {
  return request({
    url: '/campus/area/' + id,
    method: 'get'
  })
}

// 新增校园区域
export function addArea(data) {
  return request({
    url: '/campus/area',
    method: 'post',
    data: data
  })
}

// 修改校园区域
export function updateArea(data) {
  return request({
    url: '/campus/area',
    method: 'put',
    data: data
  })
}

// 删除校园区域
export function delArea(id) {
  return request({
    url: '/campus/area/' + id,
    method: 'delete'
  })
}
