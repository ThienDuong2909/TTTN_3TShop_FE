import axiosClient from "../../../services/fetch";

export const getCategories = async () => {
  const res = await axiosClient.get("/categories");
  return res.data;
};
