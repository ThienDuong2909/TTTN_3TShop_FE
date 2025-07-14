import axiosClient from "../../../services/fetch";

export const getAllProducts = async () => {
  const res = await axiosClient.get("/products");
  return res.data;
};
