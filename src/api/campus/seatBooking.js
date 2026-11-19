import request from "@/utils/request";

export function getBookingSeats(query) {
  return request({
    url: "/campus/booking/seats",
    method: "get",
    params: query,
  });
}

export function addBookingSeat(data) {
  return request({
    url: "/campus/booking",
    method: "post",
    data: data,
  });
}

// 查询当前登录人的预约
export function listMyBookings(query) {
  return request({
    url: "/campus/booking/my",
    method: "get",
    params: query,
  });
}

// 取消一条预约
export function cancelMyBooking(id, data) {
  return request({
    url: `/campus/booking/${id}/cancel`,
    method: "put",
    data,
  });
}
