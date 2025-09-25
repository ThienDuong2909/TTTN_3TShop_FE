import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, Plus, Trash2, MapPin, Calendar, AlertTriangle } from "lucide-react";
import {
  getEmployeeAreas,
  getAvailableAreasForEmployee,
  removeEmployeeAreas,
  addEmployeeAreas,
} from "../../services/api";
import type {
  KhuVuc,
  KhuVucData,
  NewAreaSelection,
} from "../../services/api.d";

interface ChangeDeliveryAreaProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: "delete" | "add";
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  type = "delete",
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "delete" ? (
              <AlertTriangle className="w-5 h-5 text-red-500" />
            ) : (
              <Plus className="w-5 h-5 text-green-500" />
            )}
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={onConfirm}
            className={
              type === "delete"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ChangeDeliveryArea: React.FC<ChangeDeliveryAreaProps> = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
}) => {
  const [khuVucData, setKhuVucData] = useState<KhuVucData | null>(null);
  const [availableAreas, setAvailableAreas] = useState<KhuVuc[]>([]);
  const [newAreaSelections, setNewAreaSelections] = useState<
    NewAreaSelection[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [areaSearch, setAreaSearch] = useState("");

  // Confirmation modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: "delete" as "delete" | "add",
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // Get current date for minimum date validation
  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  // Fetch employee's current areas
  const fetchEmployeeAreas = async () => {
    try {
      setLoading(true);
      const result = await getEmployeeAreas(employeeId);

      if (result.success) {
        console.log("Employee areas:", result.data);
        setKhuVucData(result.data);
      } else {
        throw new Error(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error fetching employee areas:", error);
      toast.error("Không thể tải danh sách khu vực phụ trách");
    } finally {
      setLoading(false);
    }
  };

  // Fetch areas not yet assigned to this employee
  const fetchAvailableAreas = async () => {
    try {
      const result = await getAvailableAreasForEmployee(employeeId);

      if (result.success) {
        console.log("Available areas:", result.data?.KhuVucChuaPhuTrach);
        setAvailableAreas(result.data?.KhuVucChuaPhuTrach || []);
      }
    } catch (error) {
      console.error("Error fetching available areas:", error);
      toast.error("Không thể tải danh sách khu vực chưa phụ trách");
    }
  };

  // Filter available areas based on search
  const filteredAvailableAreas = availableAreas.filter((area) =>
    area.TenKhuVuc.toLowerCase().includes(areaSearch.toLowerCase())
  );

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && employeeId) {
      fetchEmployeeAreas();
      fetchAvailableAreas();
      setNewAreaSelections([]);
      setShowAddSection(false);
      setAreaSearch("");
    }
  }, [isOpen, employeeId]);

  // Remove a specific area
  const handleRemoveArea = (areaId: string, areaName: string) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      title: "Xác nhận xóa khu vực",
      message: `Bạn có chắc chắn muốn xóa khu vực "${areaName}" khỏi danh sách phụ trách của nhân viên ${employeeName}?`,
      onConfirm: () => removeArea([areaId]),
    });
  };

  // Remove all areas
  const handleRemoveAllAreas = () => {
    if (!khuVucData || khuVucData.KhuVucPhuTrach.length === 0) return;

    setConfirmModal({
      isOpen: true,
      type: "delete",
      title: "Xác nhận xóa tất cả khu vực",
      message: `Bạn có chắc chắn muốn xóa tất cả ${khuVucData.KhuVucPhuTrach.length} khu vực khỏi danh sách phụ trách của nhân viên ${employeeName}?`,
      onConfirm: () => {
        const allAreaIds = khuVucData.KhuVucPhuTrach.map(
          (area) => area.MaKhuVuc
        );
        removeArea(allAreaIds);
      },
    });
  };

  // API call to remove areas
  const removeArea = async (areaIds: string[]) => {
    try {
      setLoading(true);
      const result = await removeEmployeeAreas(areaIds);

      if (result.success) {
        toast.success("Xóa khu vực thành công");
        fetchEmployeeAreas(); // Refresh current areas
        fetchAvailableAreas(); // Refresh available areas
      } else {
        throw new Error(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error removing areas:", error);
      toast.error("Không thể xóa khu vực");
    } finally {
      setLoading(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  // Add area to selection
  const handleSelectArea = (area: KhuVuc) => {
    const exists = newAreaSelections.find(
      (selection) => selection.MaKhuVuc === area.MaKhuVuc
    );
    if (!exists) {
      setNewAreaSelections([
        ...newAreaSelections,
        {
          MaKhuVuc: area.MaKhuVuc,
          TenKhuVuc: area.TenKhuVuc,
          NgayBatDau: minDate,
        },
      ]);
    }
  };

  // Remove area from selection
  const handleRemoveFromSelection = (areaId: string) => {
    setNewAreaSelections(
      newAreaSelections.filter((selection) => selection.MaKhuVuc !== areaId)
    );
  };

  // Update start date for selected area
  const handleUpdateStartDate = (areaId: string, date: string) => {
    setNewAreaSelections(
      newAreaSelections.map((selection) =>
        selection.MaKhuVuc === areaId
          ? { ...selection, NgayBatDau: date }
          : selection
      )
    );
  };

  // Add new areas
  const handleAddAreas = () => {
    if (newAreaSelections.length === 0) {
      toast.error("Vui lòng chọn ít nhất một khu vực");
      return;
    }

    // Validate dates
    const invalidDates = newAreaSelections.filter(
      (selection) => !selection.NgayBatDau || selection.NgayBatDau <= today
    );

    if (invalidDates.length > 0) {
      toast.error("Ngày bắt đầu phải lớn hơn ngày hiện tại");
      return;
    }

    const areaNames = newAreaSelections.map((s) => s.TenKhuVuc).join(", ");
    setConfirmModal({
      isOpen: true,
      type: "add",
      title: "Xác nhận thêm khu vực",
      message: `Bạn có chắc chắn muốn thêm ${newAreaSelections.length} khu vực (${areaNames}) vào danh sách phụ trách của nhân viên ${employeeName}?`,
      onConfirm: addAreas,
    });
  };

  // API call to add areas
  const addAreas = async () => {
    try {
      setLoading(true);
      const areaData = newAreaSelections.map((selection) => ({
        MaKhuVuc: selection.MaKhuVuc,
        NgayBatDau: selection.NgayBatDau,
      }));

      const result = await addEmployeeAreas(employeeId, areaData);

      if (result.success) {
        toast.success("Thêm khu vực thành công");
        setNewAreaSelections([]);
        setShowAddSection(false);
        fetchEmployeeAreas(); // Refresh current areas
        fetchAvailableAreas(); // Refresh available areas
      } else {
        throw new Error(result.message || "Có lỗi xảy ra");
      }
    } catch (error) {
      console.error("Error adding areas:", error);
      toast.error("Không thể thêm khu vực");
    } finally {
      setLoading(false);
      setConfirmModal({ ...confirmModal, isOpen: false });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Quản lý khu vực phụ trách - {employeeName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Areas Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Khu vực đang phụ trách
                  {khuVucData && (
                    <span className="text-sm font-normal text-gray-600">
                      ({khuVucData.KhuVucPhuTrach.length} khu vực)
                    </span>
                  )}
                </h3>
                {khuVucData && khuVucData.KhuVucPhuTrach.length > 0 && (
                  <Button
                    onClick={handleRemoveAllAreas}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Xóa tất cả
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">Đang tải...</div>
                </div>
              ) : khuVucData && khuVucData.KhuVucPhuTrach.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {khuVucData.KhuVucPhuTrach.map((area) => (
                    <div
                      key={area.MaKhuVuc}
                      className="bg-white p-2 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm">
                            {area.TenKhuVuc}
                          </h4>
                          <div className="flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              Từ:{" "}
                              {new Date(area.NgayBatDau).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() =>
                            handleRemoveArea(area.MaKhuVuc, area.TenKhuVuc)
                          }
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    Nhân viên chưa được phân công khu vực nào
                  </p>
                </div>
              )}
            </div>

            {/* Add New Areas Section */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Thêm khu vực phụ trách mới
                </h3>
                <Button
                  onClick={() => setShowAddSection(!showAddSection)}
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  {showAddSection ? "Ẩn" : "Thêm khu vực"}
                </Button>
              </div>

              {showAddSection && (
                <div className="space-y-4">
                  {/* Search Available Areas */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Tìm kiếm khu vực có sẵn
                    </Label>
                    <Input
                      type="text"
                      placeholder="Tìm khu vực..."
                      value={areaSearch}
                      onChange={(e) => setAreaSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  {/* Available Areas */}
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Danh sách khu vực có thể thêm (
                      {filteredAvailableAreas.length})
                    </Label>
                    <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-white">
                      {filteredAvailableAreas.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">
                          {areaSearch
                            ? "Không tìm thấy khu vực phù hợp"
                            : "Không có khu vực nào để thêm"}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {filteredAvailableAreas.map((area) => (
                            <button
                              key={area.MaKhuVuc}
                              onClick={() => handleSelectArea(area)}
                              className="text-left text-sm hover:bg-gray-50 p-2 rounded cursor-pointer transition-colors border border-gray-200 hover:border-blue-300"
                              disabled={newAreaSelections.some(
                                (s) => s.MaKhuVuc === area.MaKhuVuc
                              )}
                            >
                              <span
                                className={`truncate block ${
                                  newAreaSelections.some(
                                    (s) => s.MaKhuVuc === area.MaKhuVuc
                                  )
                                    ? "text-gray-400"
                                    : "text-gray-900"
                                }`}
                              >
                                {area.TenKhuVuc}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Selected Areas with Start Dates */}
                  {newAreaSelections.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Khu vực đã chọn ({newAreaSelections.length})
                      </Label>
                      <div className="space-y-3 bg-white p-3 rounded-md border border-gray-300">
                        {newAreaSelections.map((selection) => (
                          <div
                            key={selection.MaKhuVuc}
                            className="flex items-center gap-3 p-2 bg-gray-50 rounded border"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-gray-900 text-sm">
                                {selection.TenKhuVuc}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-gray-600">
                                Ngày bắt đầu:
                              </Label>
                              <Input
                                type="date"
                                value={selection.NgayBatDau}
                                min={minDate}
                                onChange={(e) =>
                                  handleUpdateStartDate(
                                    selection.MaKhuVuc,
                                    e.target.value
                                  )
                                }
                                className="w-fit text-xs"
                              />
                              <Button
                                onClick={() =>
                                  handleRemoveFromSelection(selection.MaKhuVuc)
                                }
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-end mt-3">
                        <Button
                          onClick={handleAddAreas}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={loading || newAreaSelections.length === 0}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Thêm {newAreaSelections.length} khu vực
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Đóng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.type === "delete" ? "Xóa" : "Thêm"}
      />
    </>
  );
};

export default ChangeDeliveryArea;
