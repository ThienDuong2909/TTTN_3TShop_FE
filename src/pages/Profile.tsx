// Thay thế toàn bộ file Profile.tsx

import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { getCustomerProfile, updateCustomerProfile, uploadAvatar } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { CLOUDINARY_CONFIG } from '../config/cloudinary';
import { toast } from 'sonner';
import { 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar,
  Camera,
  Save,
  RotateCcw,
  Loader2,
  Mail
} from 'lucide-react';

// Skeleton Component
const Skeleton = ({ className = "", ...props }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} {...props} />
);

// Profile Skeleton Component
const ProfileSkeleton = () => (
  <div className="space-y-6">

    {/* Profile Card Skeleton */}
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Avatar Section Skeleton */}
          <div className="flex flex-col items-center space-y-4 lg:min-w-[250px]">
            {/* Avatar with gradient placeholder */}
            <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse">
              <Skeleton className="w-full h-full rounded-full border-4 border-white" />
            </div>
            
            {/* Upload Button */}
            <div className="text-center space-y-2">
              <Skeleton className="h-10 w-32 rounded-lg" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden lg:block w-px bg-gray-200 self-stretch"></div>
          
          {/* Horizontal Divider for mobile */}
          <div className="lg:hidden w-full h-px bg-gray-200"></div>

          {/* Form Section Skeleton */}
          <div className="flex-1 space-y-6">
            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-2" /> {/* Asterisk */}
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-10 w-full bg-gray-100" />
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-2" /> {/* Asterisk */}
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* CCCD Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Birthday Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            </div>

            {/* Gender Section */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-6">
                {['Nam', 'Nữ', 'Khác'].map((_, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-32 opacity-50" />
                <Skeleton className="h-10 w-24 opacity-50" />
              </div>
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default function Profile() {
  const { state } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Original data từ API
  const [originalData, setOriginalData] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    TenKH: '',
    DiaChi: '',
    SDT: '',
    CCCD: '',
    NgaySinh: '',
    GioiTinh: '',
    AnhDaiDien: ''
  });

  // Progressive loading states
  const [progressiveStates, setProgressiveStates] = useState({
    header: false,
    avatar: false,
    formFields: false,
    gender: false,
    actions: false
  });

  // Load profile data
  useEffect(() => {
    if (state.user?.id) {
      loadProfile();
    }
  }, [state.user?.id]);

  const getGenderText = (genderNumber) => {
  switch (genderNumber) {
    case 0:
      return 'Nam';
    case 1:
      return 'Nữ';
    case 2:
      return 'Khác';
    default:
      return '';
  }
};

  const getGenderNumber = (genderText) => {
    switch (genderText) {
      case 'Nam':
        return 0;
      case 'Nữ':
        return 1;
      case 'Khác':
        return 2;
      default:
        return null;
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Reset progressive states
      setProgressiveStates({
        header: false,
        avatar: false,
        formFields: false,
        gender: false,
        actions: false
      });

      const response = await getCustomerProfile();
      console.log("Profile response:", response);

      if (response.success) {
        const data = response.data;
        const profileData = {
          TenKH: data.TenKH || '',
          DiaChi: data.DiaChi || '',
          SDT: data.SDT || '',
          CCCD: data.CCCD || '',
          NgaySinh: data.NgaySinh ? data.NgaySinh.split('T')[0] : '', // Format date for input
          GioiTinh: getGenderText(data.GioiTinh),
          AnhDaiDien: data.AnhDaiDien || ''
        };
        
        setOriginalData(profileData);
        setFormData(profileData);
        setLoading(false);
        
        // Start progressive loading animation
        setTimeout(() => setProgressiveStates(prev => ({ ...prev, header: true })), 100);
        setTimeout(() => setProgressiveStates(prev => ({ ...prev, avatar: true })), 300);
        setTimeout(() => setProgressiveStates(prev => ({ ...prev, formFields: true })), 500);
        setTimeout(() => setProgressiveStates(prev => ({ ...prev, gender: true })), 700);
        setTimeout(() => setProgressiveStates(prev => ({ ...prev, actions: true })), 900);
      }
    } catch (error) {
      toast.error('Không thể tải thông tin profile');
      console.error('Error loading profile:', error);
      setLoading(false);
    }
  };

  // Check if form has changes
  const hasChanges = () => {
    if (!originalData) return false;
    
    return Object.keys(formData).some(key => {
      if (key === 'AnhDaiDien') return false; // Ignore avatar for form changes
      return formData[key] !== originalData[key];
    });
  };

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Thêm hàm upload to Cloudinary (copy từ ProductAdd.tsx)
const uploadImageToCloudinary = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CONFIG.CLOUD_NAME);

    const response = await fetch(CLOUDINARY_CONFIG.API_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      console.error('Cloudinary upload failed:', data);
      return null;
    }
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    return null;
  }
};

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    toast.error('Vui lòng chọn file ảnh');
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('Kích thước ảnh không được vượt quá 5MB');
    return;
  }

  try {
    setUploading(true);
    toast.info('Đang upload ảnh...');

    // Upload to Cloudinary first
    const cloudinaryUrl = await uploadImageToCloudinary(file);
    if (!cloudinaryUrl) {
      toast.error('Không thể upload ảnh lên Cloudinary');
      return;
    }

    // Then send maKH and URL to backend
    const response = await uploadAvatar({
      maKH: state.user.id,
      AnhDaiDien: cloudinaryUrl
    });
    
    if (response.success) {
      // Update avatar in both original and form data
      setOriginalData(prev => ({ ...prev, AnhDaiDien: cloudinaryUrl }));
      setFormData(prev => ({ ...prev, AnhDaiDien: cloudinaryUrl }));
      toast.success('Cập nhật ảnh đại diện thành công');
    } else {
      toast.error(response.message || 'Không thể cập nhật ảnh đại diện');
    }
  } catch (error) {
    toast.error('Không thể cập nhật ảnh đại diện');
    console.error('Error uploading avatar:', error);
  } finally {
    setUploading(false);
  }
};
  

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!formData.TenKH.trim()) {
        toast.error('Tên khách hàng không được để trống');
        return;
      }

      if (!formData.SDT.trim()) {
        toast.error('Số điện thoại không được để trống');
        return;
      }

      // Validate phone number
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(formData.SDT)) {
        toast.error('Số điện thoại không hợp lệ');
        return;
      }

      // Validate CCCD
      if (formData.CCCD && !/^[0-9]{12}$/.test(formData.CCCD)) {
        toast.error('CCCD phải có 12 chữ số');
        return;
      }

       if (formData.NgaySinh) {
      const birthDate = new Date(formData.NgaySinh);
      const currentDate = new Date();
      
      // Reset time để so sánh chỉ ngày
      birthDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      if (birthDate > currentDate) {
        toast.error('Ngày sinh không thể là ngày tương lai');
        return;
      }

      // Optional: Validate minimum age (ví dụ >= 13 tuổi)
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 13);
      minDate.setHours(0, 0, 0, 0);
      
      if (birthDate > minDate) {
        toast.error('Bạn phải từ 13 tuổi trở lên');
        return;
      }

      // Optional: Validate maximum age (ví dụ <= 120 tuổi)
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() - 120);
      maxDate.setHours(0, 0, 0, 0);
      
      if (birthDate < maxDate) {
        toast.error('Ngày sinh không hợp lệ');
        return;
      }
    }

      const updateData = {
        TenKH: formData.TenKH.trim(),
        DiaChi: formData.DiaChi.trim(),
        SDT: formData.SDT.trim(),
        CCCD: formData.CCCD.trim(),
        NgaySinh: formData.NgaySinh || null,
        GioiTinh: getGenderNumber(formData.GioiTinh)
      };

      const response = await updateCustomerProfile(state.user.id, updateData);
      
      if (response.success) {
        // Update original data
        setOriginalData({ ...formData });
        toast.success('Cập nhật thông tin thành công');
      }
    } catch (error) {
      toast.error('Không thể cập nhật thông tin');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  // Handle reset
  const handleReset = () => {
    if (originalData) {
      setFormData({ ...originalData });
    }
  };

  // Hiển thị skeleton khi đang loading
  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-6">

      {/* Profile Information Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle 
            className={`flex items-center gap-2 transition-all duration-500 ${
              progressiveStates.header ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <User className="h-5 w-5" />
            Thông tin chi tiết
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Avatar Section */}
            <div 
              className={`flex flex-col items-center space-y-4 lg:min-w-[250px] transition-all duration-500 ${
                progressiveStates.avatar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="relative">
                <div className="w-40 h-40 rounded-full p-1 bg-gradient-to-r from-blue-500 to-purple-600">
                  <Avatar className="w-full h-full border-4 border-white">
                    <AvatarImage 
                      src={formData.AnhDaiDien} 
                      alt="Avatar" 
                      className="object-cover"
                    />
                    <AvatarFallback className="text-3xl bg-gray-100">
                      <User className="h-16 w-16 text-gray-400" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <Camera className="h-4 w-4" />
                    {uploading ? 'Đang tải...' : 'Thay đổi ảnh'}
                  </div>
                </Label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG tối đa 5MB
                </p>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden lg:block w-px bg-gray-200 self-stretch"></div>
            
            {/* Horizontal Divider for mobile */}
            <div className="lg:hidden w-full h-px bg-gray-200"></div>

            {/* Form Section */}
            <div className="flex-1 space-y-6">
              <div 
                className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 ${
                  progressiveStates.formFields ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                {/* Tên khách hàng */}
                <div className="space-y-2">
                  <Label htmlFor="tenKH" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Họ và tên *
                  </Label>
                  <Input
                    id="tenKH"
                    value={formData.TenKH}
                    onChange={(e) => handleChange('TenKH', e.target.value)}
                    placeholder="Nhập họ và tên"
                  />
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    value={state.user?.email || ''}
                    disabled
                    className="bg-gray-50"
                  />
                </div>

                {/* Số điện thoại */}
                <div className="space-y-2">
                  <Label htmlFor="sdt" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Số điện thoại *
                  </Label>
                  <Input
                    id="sdt"
                    value={formData.SDT}
                    onChange={(e) => handleChange('SDT', e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                {/* CCCD */}
                <div className="space-y-2">
                  <Label htmlFor="cccd" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Căn cước công dân
                  </Label>
                  <Input
                    id="cccd"
                    value={formData.CCCD}
                    onChange={(e) => handleChange('CCCD', e.target.value)}
                    placeholder="Nhập số CCCD"
                  />
                </div>

                {/* Ngày sinh */}
                <div className="space-y-2">
                  <Label htmlFor="ngaySinh" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Ngày sinh
                  </Label>
                  <Input
                    id="ngaySinh"
                    type="date"
                    value={formData.NgaySinh}
                    onChange={(e) => handleChange('NgaySinh', e.target.value)}
                  />
                </div>

                {/* Địa chỉ */}
                <div className="space-y-2">
                  <Label htmlFor="diaChi" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ
                  </Label>
                  <Input
                    id="diaChi"
                    value={formData.DiaChi}
                    onChange={(e) => handleChange('DiaChi', e.target.value)}
                    placeholder="Nhập địa chỉ"
                  />
                </div>
              </div>

              {/* Giới tính */}
              <div 
                className={`space-y-3 transition-all duration-500 ${
                  progressiveStates.gender ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <Label className="text-sm font-medium">Giới tính</Label>
                <RadioGroup
                  value={formData.GioiTinh}
                  onValueChange={(value) => handleChange('GioiTinh', value)}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Nam" id="nam" />
                    <Label htmlFor="nam">Nam</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Nữ" id="nu" />
                    <Label htmlFor="nu">Nữ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Khác" id="khac" />
                    <Label htmlFor="khac">Khác</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Action Buttons */}
              <div 
                className={`flex gap-3 pt-4 border-t transition-all duration-500 ${
                  progressiveStates.actions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges() || saving}
                  className="flex items-center gap-2"
                  style={{ 
                    backgroundColor: hasChanges() ? '#684827' : undefined,
                    opacity: hasChanges() ? 1 : 0.5
                  }}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges() || saving}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Đặt lại
                </Button>
              </div>

              <div 
                className={`text-xs text-gray-500 pt-2 transition-all duration-500 ${
                  progressiveStates.actions ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                * Những trường có dấu sao là bắt buộc
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}