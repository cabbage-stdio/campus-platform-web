import request from "@/utils/request";

// 查询座位预约列表
export function listBooking(query) {
  return request({
    url: "/campus/booking/list",
    method: "get",
    params: query,
  });
}

// 查询座位预约详细
export function getBooking(id) {
  return request({
    url: "/campus/booking/" + id,
    method: "get",
  });
}

// 新增座位预约
export function addBooking(data) {
  return request({
    url: "/campus/booking",
    method: "post",
    data: data,
  });
}

// 修改座位预约
export function updateBooking(data) {
  return request({
    url: "/campus/booking",
    method: "put",
    data: data,
  });
}

// 删除座位预约
export function delBooking(id) {
  return request({
    url: "/campus/booking/" + id,
    method: "delete",
  });
}

export function getBookingRules() {
  return request({
    url: "/campus/booking/rules",
    method: "get",
  });
}

export function getBookingSeats(query) {
  return request({
    url: "/campus/booking/seats",
    method: "get",
    params: query,
  });
}

export function adminCancelBooking(id, cancelReason) {
  return request({
    url: `/campus/booking/${id}/admin/cancel`,
    method: "put",
    data: { cancelReason },
  });
}

export function updateBookingRemark(id, remark) {
  return request({
    url: `/campus/booking/${id}/admin/remark`,
    method: "put",
    data: { remark },
  });
}
