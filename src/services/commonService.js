import axiosClient from "./fetch";

// Lấy danh sách nhân viên
export const getEmployees = async () => {
  const res = await axiosClient.get("/employees");
  return res.data;
};

// Lấy thông tin nhân viên hiện tại
export const getCurrentEmployee = async () => {
  const res = await axiosClient.get("/auth/profile");
  return res.data;
};

// Lấy danh sách màu sắc
export const getColors = async () => {
  const res = await axiosClient.get("/colors");
  return res.data;
};

// Lấy danh sách kích thước  
export const getSizes = async () => {
  const res = await axiosClient.get("/sizes");
  return res.data;
}; 