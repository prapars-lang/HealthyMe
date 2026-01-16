
import React, { useState, useEffect } from 'react';
import { HealthLog } from '../types';
import { Save, X, Loader2, ChevronRight, ChevronLeft, Calculator } from 'lucide-react';

interface HealthLogFormProps {
  userId: string;
  onSave: (log: any) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const HealthLogForm: React.FC<HealthLogFormProps> = ({ userId, onSave, onCancel, isSaving = false }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    missions: {
      m1: true, m2: true, m3: true, m4: true, m5: true, 
      m6: true, m7: true, m8: true, m9: true, m10: true
    },
    mood: 'happy',
    water_glasses: 8,
    sleep_start: '21:00',
    sleep_end: '06:00',
    exercise_activity: '',
    exercise_minutes: 30,
    sickness: '',
    height: 140,
    weight: 35,
    bmi: 17.8,
    // Fix: Added steps and vegetable_score to initial state for HealthLog
    steps: 6000,
    vegetable_score: 8
  });

  // คำนวณ BMI อัตโนมัติ
  useEffect(() => {
    if (formData.height > 0 && formData.weight > 0) {
      const heightInM = formData.height / 100;
      const bmiValue = parseFloat((formData.weight / (heightInM * heightInM)).toFixed(1));
      setFormData(prev => ({ ...prev, bmi: bmiValue }));
    }
  }, [formData.height, formData.weight]);

  const missionsList = [
    { id: 'm1', icon: '🪥', text: '1. วันนี้แปรงฟันอย่างน้อย 2 ครั้ง (เช้าและก่อนนอน) ใช่ไหม?' },
    { id: 'm2', icon: '🧼', text: '2. ล้างมือด้วยสบู่ก่อนกินอาหาร และหลังเข้าห้องน้ำทุกครั้ง ใช่ไหม?' },
    { id: 'm3', icon: '💧', text: '3. ดื่มน้ำสะอาดอย่างน้อย 6-8 แก้ว ใช่ไหม?' },
    { id: 'm4', icon: '🥗', text: '4. กินผักและผลไม้หลากหลายเป็นประจำทุกวัน ใช่ไหม?' },
    { id: 'm5', icon: '🏃', text: '5. ออกกำลังกายหรือเคลื่อนไหวร่างกายอย่างน้อย 30 นาที ใช่ไหม?' },
    { id: 'm6', icon: '😴', text: '6. เข้านอนไม่ดึกเกินไป (เช่น ก่อน 3 ทุ่ม) เพื่อพักผ่อนเพียงพอ ใช่ไหม?' },
    { id: 'm7', icon: '🚫🍬', text: '7. ไม่กินขนมกรุบกรอบ หรือดื่มน้ำหวาน/น้ำอัดลมมากเกินไป ใช่ไหม?' },
    { id: 'm8', icon: '🚽', text: '8. ขับถ่ายอุจจาระเป็นเวลาทุกวัน ใช่ไหม?' },
    { id: 'm9', icon: '📵', text: '9. ใช้เวลาเล่นโทรศัพท์มือถือ/คอมพิวเตอร์ไม่นานเกิน 1-2 ชั่วโมงต่อวัน (นอกเวลาเรียน) ใช่ไหม?' },
    { id: 'm10', icon: '😊', text: '10. วันนี้โดยรวมแล้วอารมณ์ดี ยิ้มแย้มแจ่มใส ใช่ไหม?' },
  ];

  const moodOptions = [
    { val: 'happy', icon: '😀', label: 'ยิ้มแฉ่ง' },
    { val: 'normal', icon: '🙂', label: 'เฉยๆ' },
    { val: 'sad', icon: '😟', label: 'เศร้า' },
    { val: 'sleepy', icon: '😴', label: 'ง่วง' },
    { val: 'angry', icon: '😠', label: 'โกรธ' },
  ];

  const calculateSleepHours = () => {
    const [h1, m1] = formData.sleep_start.split(':').map(Number);
    const [h2, m2] = formData.sleep_end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60; // ข้ามคืน
    return parseFloat((diff / 60).toFixed(1));
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      user_id: userId,
      sleep_hours: calculateSleepHours()
    });
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 15) return { label: 'ผอมไปนิด', color: 'text-blue-500' };
    if (bmi < 22) return { label: 'หุ่นดีมาก!', color: 'text-emerald-500' };
    if (bmi < 25) return { label: 'เริ่มท้วมแล้ว', color: 'text-yellow-500' };
    return { label: 'อวบระยะสุดท้าย', color: 'text-red-500' };
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-4 border-blue-100 max-h-[90vh] flex flex-col relative">
      {isSaving && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="font-black text-blue-600">กำลังส่งสมุดบันทึกไปให้พี่หมอ...</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-blue-500 p-6 text-white text-center shrink-0">
        <h2 className="text-xl font-black flex items-center justify-center gap-2">
          📖 แบบบันทึกสุขภาพประจำวัน
        </h2>
        <p className="text-xs opacity-80 mt-1 font-bold">บันทึกความดี รับเหรียญสะสม!</p>
      </div>

      {/* Body */}
      <div className="flex-grow overflow-y-auto p-8 space-y-10 custom-scrollbar">
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h3 className="font-black text-slate-800 text-lg border-b pb-2 flex items-center gap-2">
               🏋️ ข้อมูลสัดส่วนและ BMI
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <label className="block text-xs font-black text-slate-400 mb-2 uppercase">ส่วนสูง (ซม.)</label>
                <input 
                  type="number" 
                  className="w-full text-2xl font-black bg-transparent outline-none text-blue-600"
                  value={formData.height}
                  onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                />
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <label className="block text-xs font-black text-slate-400 mb-2 uppercase">น้ำหนัก (กก.)</label>
                <input 
                  type="number" 
                  className="w-full text-2xl font-black bg-transparent outline-none text-blue-600"
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm text-blue-500"><Calculator size={24}/></div>
                <div>
                  <div className="text-xs font-bold text-slate-500">ค่า BMI ของน้องคือ</div>
                  <div className={`text-2xl font-black ${getBMICategory(formData.bmi).color}`}>{formData.bmi}</div>
                </div>
              </div>
              <div className={`text-sm font-black px-4 py-2 bg-white rounded-full shadow-sm border border-blue-100 ${getBMICategory(formData.bmi).color}`}>
                {getBMICategory(formData.bmi).label}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h3 className="font-black text-slate-800 text-lg border-b pb-2">🎯 ภารกิจพฤติกรรมสุขภาพ</h3>
            <div className="space-y-4">
              {missionsList.map((m) => (
                <div key={m.id} className="bg-slate-50 p-5 rounded-3xl flex items-center justify-between gap-4 border border-slate-100 transition-all hover:bg-white hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.icon}</span>
                    <span className="text-sm font-bold text-slate-600 leading-tight">{m.text}</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setFormData({...formData, missions: {...formData.missions, [m.id]: true}})}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${formData.missions[m.id as keyof typeof formData.missions] ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                    >
                      ใช่
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, missions: {...formData.missions, [m.id]: false}})}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${!formData.missions[m.id as keyof typeof formData.missions] ? 'bg-rose-400 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                    >
                      ไม่ใช่
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <section className="space-y-4">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">😊 อารมณ์วันนี้เป็นอย่างไร?</h3>
              <div className="grid grid-cols-5 gap-2">
                {moodOptions.map(m => (
                  <button
                    key={m.val}
                    onClick={() => setFormData({...formData, mood: m.val})}
                    className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${formData.mood === m.val ? 'bg-blue-50 border-blue-400 scale-105' : 'bg-slate-50 border-transparent opacity-50 grayscale'}`}
                  >
                    <span className="text-3xl">{m.icon}</span>
                    <span className="text-[10px] font-bold mt-1 text-slate-600">{m.label}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Added Steps Input */}
            <section className="space-y-4">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">👣 ก้าวเดินวันนี้</h3>
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <input 
                  type="number" 
                  className="w-full text-2xl font-black bg-transparent outline-none text-blue-600"
                  value={formData.steps}
                  onChange={(e) => setFormData({...formData, steps: Number(e.target.value)})}
                  placeholder="เช่น 6000"
                />
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">จำนวนก้าว (เป้าหมาย 6000+)</p>
              </div>
            </section>

            {/* Added Vegetable Score Input */}
            <section className="space-y-4">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">🥦 คะแนนการกินผัก (0-10)</h3>
              <div className="flex items-center gap-4 bg-emerald-50 p-6 rounded-[2rem] border-2 border-emerald-100">
                <input 
                  type="range" min="0" max="10" 
                  className="flex-grow accent-emerald-500 h-2 bg-emerald-100 rounded-lg"
                  value={formData.vegetable_score}
                  onChange={(e) => setFormData({...formData, vegetable_score: Number(e.target.value)})}
                />
                <div className="bg-white px-6 py-2 rounded-2xl font-black text-emerald-600 shadow-sm border border-emerald-100 min-w-[100px] text-center">
                  {formData.vegetable_score} / 10
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">💧 ดื่มน้ำกี่แก้ว?</h3>
              <div className="flex items-center gap-4 bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100">
                <input 
                  type="range" min="0" max="15" 
                  className="flex-grow accent-blue-500 h-2 bg-blue-100 rounded-lg"
                  value={formData.water_glasses}
                  onChange={(e) => setFormData({...formData, water_glasses: Number(e.target.value)})}
                />
                <div className="bg-white px-6 py-2 rounded-2xl font-black text-blue-600 shadow-sm border border-blue-100 min-w-[100px] text-center">
                  {formData.water_glasses} แก้ว
                </div>
              </div>
            </section>

            <section className="space-y-4">
               <h3 className="font-black text-slate-800 text-lg">😴 การนอนหลับ</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase">เวลานอน (เมื่อคืน)</label>
                    <input 
                      type="time" 
                      className="w-full font-black text-indigo-600 bg-transparent"
                      value={formData.sleep_start}
                      onChange={(e) => setFormData({...formData, sleep_start: e.target.value})}
                    />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase">เวลาตื่น (เช้านี้)</label>
                    <input 
                      type="time" 
                      className="w-full font-black text-indigo-600 bg-transparent"
                      value={formData.sleep_end}
                      onChange={(e) => setFormData({...formData, sleep_end: e.target.value})}
                    />
                  </div>
               </div>
            </section>

            <section className="space-y-4">
               <h3 className="font-black text-slate-800 text-lg">🏃 การออกกำลังกาย</h3>
               <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="กิจกรรมที่ทำ (เช่น วิ่งเล่น, ปั่นจักรยาน)"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-600"
                    value={formData.exercise_activity}
                    onChange={(e) => setFormData({...formData, exercise_activity: e.target.value})}
                  />
                  <input 
                    type="number" 
                    placeholder="ระยะเวลา (นาที)"
                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-600"
                    value={formData.exercise_minutes}
                    onChange={(e) => setFormData({...formData, exercise_minutes: Number(e.target.value)})}
                  />
               </div>
            </section>

            <section className="space-y-4 pb-4">
               <h3 className="font-black text-slate-800 text-lg">🏥 อาการป่วย (ถ้ามี)</h3>
               <textarea 
                  placeholder="วันนี้รู้สึกไม่สบายตรงไหนไหม? บอกพี่หมอได้นะ"
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-600 h-24"
                  value={formData.sickness}
                  onChange={(e) => setFormData({...formData, sickness: e.target.value})}
               />
            </section>
          </div>
        )}
      </div>

      {/* Footer / Nav Buttons */}
      <div className="p-8 shrink-0 bg-slate-50 border-t flex gap-4">
        {step > 1 && (
          <button 
            disabled={isSaving}
            onClick={() => setStep(step - 1)}
            className="flex-1 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-400 hover:bg-slate-50"
          >
            <ChevronLeft className="inline mr-1" /> ย้อนกลับ
          </button>
        )}
        
        {step < 3 ? (
          <button 
            onClick={() => setStep(step + 1)}
            className="flex-[2] py-4 bg-blue-500 text-white rounded-2xl font-black shadow-lg shadow-blue-100 hover:brightness-110"
          >
            ถัดไป <ChevronRight className="inline ml-1" />
          </button>
        ) : (
          <button 
            disabled={isSaving}
            onClick={handleSubmit}
            className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:brightness-110 flex items-center justify-center gap-2"
          >
            <Save size={20} /> บันทึกเลยจ้า!
          </button>
        )}
      </div>

      <button 
        onClick={onCancel}
        className="absolute top-4 right-4 p-2 bg-white/10 text-white hover:bg-white/20 rounded-full transition-colors z-[60]"
      >
        <X />
      </button>
    </div>
  );
};

export default HealthLogForm;
