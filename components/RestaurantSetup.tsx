import React, { useState } from 'react';
import { RestaurantProfile } from '../types';
import { Store, MapPin, ChefHat, Maximize2, Armchair, Star } from 'lucide-react';

interface Props {
  onComplete: (profile: RestaurantProfile) => void;
  existingProfile?: RestaurantProfile | null;
}

// Danh sách thành phố lớn tại Đức
const GERMAN_CITIES: Record<string, string[]> = {
  'Berlin': ['Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf', 'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln', 'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'],
  'München': ['Altstadt-Lehel', 'Ludwigsvorstadt-Isarvorstadt', 'Maxvorstadt', 'Schwabing-West', 'Au-Haidhausen', 'Sendling', 'Bogenhausen', 'Berg am Laim', 'Pasing'],
  'Hamburg': ['Mitte', 'Altona', 'Eimsbüttel', 'Nord', 'Wandsbek', 'Bergedorf', 'Harburg', 'St. Pauli', 'Eppendorf', 'Winterhude'],
  'Frankfurt am Main': ['Innenstadt', 'Altstadt', 'Sachsenhausen', 'Bornheim', 'Nordend', 'Westend', 'Bockenheim', 'Ostend'],
  'Köln': ['Innenstadt', 'Ehrenfeld', 'Nippes', 'Lindenthal', 'Sülz', 'Deutz', 'Porz', 'Kalk'],
  'Düsseldorf': ['Altstadt', 'Carlstadt', 'Stadtmitte', 'Pempelfort', 'Flingern', 'Bilk', 'Oberkassel', 'Derendorf'],
  'Stuttgart': ['Mitte', 'Süd', 'West', 'Nord', 'Ost', 'Bad Cannstatt', 'Vaihingen'],
  'Dortmund': ['Innenstadt-West', 'Innenstadt-Ost', 'Innenstadt-Nord', 'Eving', 'Scharnhorst', 'Brackel'],
  'Essen': ['Stadtmitte', 'Rüttenscheid', 'Werden', 'Steele', 'Altenessen'],
  'Leipzig': ['Mitte', 'Zentrum-Süd', 'Zentrum-West', 'Südvorstadt', 'Connewitz', 'Plagwitz'],
  'Bremen': ['Mitte', 'Neustadt', 'Schwachhausen', 'Viertel', 'Findorff'],
  'Dresden': ['Altstadt', 'Neustadt', 'Blasewitz', 'Loschwitz', 'Striesen'],
  'Hannover': ['Mitte', 'Linden-Limmer', 'Südstadt', 'Nordstadt', 'List'],
  'Nürnberg': ['Altstadt', 'Südstadt', 'Gostenhof', 'St. Johannis', 'Maxfeld'],
  'Khác': ['Khác'],
};

const CUISINE_TYPES = [
  'Việt Nam', 'Thái Lan', 'Nhật Bản', 'Trung Quốc', 'Hàn Quốc', 'Ấn Độ',
  'Đức', 'Ý', 'Pháp', 'Tây Ban Nha', 'Thổ Nhĩ Kỳ', 'Hy Lạp',
  'Mexico', 'Mỹ / Burger', 'Fusion / Hỗn hợp', 'Khác'
];

const RESTAURANT_CLASSES = [
  { value: 'budget' as const, label: 'Bình dân', desc: 'Quán ăn nhanh, bình dân', icon: '🍜' },
  { value: 'mid' as const, label: 'Trung cấp', desc: 'Nhà hàng gia đình', icon: '🍽️' },
  { value: 'premium' as const, label: 'Cao cấp', desc: 'Fine dining, sang trọng', icon: '⭐' },
];

const RestaurantSetup: React.FC<Props> = ({ onComplete, existingProfile }) => {
  const [profile, setProfile] = useState<RestaurantProfile>(existingProfile || {
    city: '',
    district: '',
    cuisineType: '',
    areaM2: 0,
    seatsIndoor: 0,
    seatsOutdoor: 0,
    restaurantClass: 'mid',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const districts = profile.city ? GERMAN_CITIES[profile.city] || [] : [];

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!profile.city) newErrors.city = 'Vui lòng chọn thành phố';
    if (!profile.district) newErrors.district = 'Vui lòng chọn quận';
    if (!profile.cuisineType) newErrors.cuisineType = 'Vui lòng chọn chủng loại ẩm thực';
    if (!profile.areaM2 || profile.areaM2 <= 0) newErrors.areaM2 = 'Vui lòng nhập diện tích';
    if (!profile.seatsIndoor || profile.seatsIndoor <= 0) newErrors.seatsIndoor = 'Vui lòng nhập số ghế';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onComplete(profile);
    }
  };

  const updateField = (field: keyof RestaurantProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d14] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-2xl mb-4 border border-blue-500/20">
            <Store size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Thông tin Nhà hàng</h1>
          <p className="text-gray-400 text-sm">Nhập thông tin để AI phân tích chính xác hơn cho nhà hàng của bạn</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#11131b] rounded-2xl border border-gray-800 p-6 space-y-6 shadow-xl">
          
          {/* 1. Địa điểm */}
          <div>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MapPin size={16} /> Địa điểm
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Thành phố</label>
                <select
                  value={profile.city}
                  onChange={e => {
                    updateField('city', e.target.value);
                    updateField('district', '');
                  }}
                  className={`w-full bg-[#1a1d26] border ${errors.city ? 'border-red-500' : 'border-gray-700'} rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-blue-500 transition-colors`}
                >
                  <option value="">-- Chọn thành phố --</option>
                  {Object.keys(GERMAN_CITIES).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Quận</label>
                <select
                  value={profile.district}
                  onChange={e => updateField('district', e.target.value)}
                  disabled={!profile.city}
                  className={`w-full bg-[#1a1d26] border ${errors.district ? 'border-red-500' : 'border-gray-700'} rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50`}
                >
                  <option value="">-- Chọn quận --</option>
                  {districts.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                {errors.district && <p className="text-red-400 text-xs mt-1">{errors.district}</p>}
              </div>
            </div>
          </div>

          {/* 2. Chủng loại ẩm thực */}
          <div>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ChefHat size={16} /> Chủng loại ẩm thực
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {CUISINE_TYPES.map(cuisine => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => updateField('cuisineType', cuisine)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                    profile.cuisineType === cuisine
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-[#1a1d26] border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
            {errors.cuisineType && <p className="text-red-400 text-xs mt-1">{errors.cuisineType}</p>}
          </div>

          {/* 3. Diện tích & Chỗ ngồi */}
          <div>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Maximize2 size={16} /> Quy mô nhà hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Diện tích (m²)</label>
                <input
                  type="number"
                  value={profile.areaM2 || ''}
                  onChange={e => updateField('areaM2', parseInt(e.target.value) || 0)}
                  placeholder="120"
                  className={`w-full bg-[#1a1d26] border ${errors.areaM2 ? 'border-red-500' : 'border-gray-700'} rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-blue-500 transition-colors`}
                />
                {errors.areaM2 && <p className="text-red-400 text-xs mt-1">{errors.areaM2}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  <Armchair size={14} /> Ghế trong nhà
                </label>
                <input
                  type="number"
                  value={profile.seatsIndoor || ''}
                  onChange={e => updateField('seatsIndoor', parseInt(e.target.value) || 0)}
                  placeholder="40"
                  className={`w-full bg-[#1a1d26] border ${errors.seatsIndoor ? 'border-red-500' : 'border-gray-700'} rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-blue-500 transition-colors`}
                />
                {errors.seatsIndoor && <p className="text-red-400 text-xs mt-1">{errors.seatsIndoor}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
                  ☀️ Ghế ngoài trời
                </label>
                <input
                  type="number"
                  value={profile.seatsOutdoor || ''}
                  onChange={e => updateField('seatsOutdoor', parseInt(e.target.value) || 0)}
                  placeholder="20"
                  className="w-full bg-[#1a1d26] border border-gray-700 rounded-lg px-3 py-2.5 text-gray-100 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <p className="text-gray-600 text-xs mt-1">Không bắt buộc</p>
              </div>
            </div>
          </div>

          {/* 4. Đẳng cấp */}
          <div>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Star size={16} /> Đẳng cấp nhà hàng
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {RESTAURANT_CLASSES.map(cls => (
                <button
                  key={cls.value}
                  type="button"
                  onClick={() => updateField('restaurantClass', cls.value)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    profile.restaurantClass === cls.value
                      ? 'bg-blue-500/10 border-blue-500 text-blue-300'
                      : 'bg-[#1a1d26] border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <div className="text-2xl mb-2">{cls.icon}</div>
                  <div className="font-bold text-sm">{cls.label}</div>
                  <div className="text-xs opacity-70 mt-1">{cls.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition-all text-lg"
          >
            Bắt đầu sử dụng
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-4">
          🔒 Thông tin được lưu cục bộ trên trình duyệt. Không tải lên máy chủ.
        </p>
      </div>
    </div>
  );
};

export default RestaurantSetup;
