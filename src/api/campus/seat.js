import request from '@/utils/request'

// 查询座位管理列表
export function listSeat(query) {
  return request({
    url: '/campus/seat/list',
    method: 'get',
    params: query
  })
}

// 查询座位管理详细
export function getSeat(id) {
  return request({
    url: '/campus/seat/' + id,
    method: 'get'
  })
}

// 新增座位管理
export function addSeat(data) {
  return request({
    url: '/campus/seat',
    method: 'post',
    data: data
  })
}

// 修改座位管理
export function updateSeat(data) {
  return request({
    url: '/campus/seat',
    method: 'put',
    data: data
  })
}

// 删除座位管理
export function delSeat(id) {
  return request({
    url: '/campus/seat/' + id,
    method: 'delete'
  })
}
