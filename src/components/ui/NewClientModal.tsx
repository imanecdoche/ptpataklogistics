import React, { useState, useEffect } from 'react';
import { Client } from '@/types/database';
import { createClient, formatClientName, formatClientNameLive } from '@/lib/clientService';
import { formatPhoneNumber } from '@/lib/phoneUtils';
import { formatPersonName, formatPersonNameLive } from '@/lib/nameUtils';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Icons8Close } from '@/components/icons/Icons8';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialName?: string;
  onCreated: (client: Client) => void;
}

export function NewClientModal({
  isOpen,
  onClose,
  initialName = '',
  onCreated
}: NewClientModalProps): React.JSX.Element | null {
  const [name, setName] = useState('');
  const [picName, setPicName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName ? formatClientName(initialName) : '');
      setPicName('');
      setPhoneNumber('');
      setErrorMessage('');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const formatted = formatClientName(name);

    if (!formatted.trim()) {
      setErrorMessage('Nama resmi PT / perusahaan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      const cleanPhone = formatPhoneNumber(phoneNumber);
      const newClient = await createClient({
        name: formatted,
        picName: formatPersonName(picName),
        phoneNumber: cleanPhone
      });
      onCreated(newClient);
      onClose();
    } catch (err) {
      console.error('Gagal mendaftarkan klien baru:', err);
      setErrorMessage('Gagal mendaftarkan klien baru ke database. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 select-none"
    >
      {/* Dim Backdrop tanpa blur */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container: Bottom Sheet Drawer di mobile, Center Pop-up di desktop */}
      <div className="relative w-full md:max-w-md bg-white rounded-t-[20px] md:rounded-[12px] max-h-[92vh] md:max-h-[90vh] flex flex-col overflow-hidden z-10 shadow-2xl animate-in slide-in-from-bottom duration-300 ease-out">
        {/* Header Modal Bersih: Judul di tengah pada mobile */}
        <div className="px-5 py-3.5 border-b border-[#eaeaea] flex items-center justify-between flex-shrink-0 relative">
          <div className="w-full text-center md:text-left">
            <h3 className="text-sm font-semibold text-[#111111]">
              Daftarkan Klien / Pembeli Baru
            </h3>
            <p className="text-xs text-[#666666] mt-0.5">
              Simpan data PT, CV, atau mandor perorangan ke master database.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex p-1.5 rounded-full hover:bg-[#f5f5f5] text-[#666666] hover:text-[#111111] transition-colors"
            aria-label="Tutup"
          >
            <Icons8Close size={18} />
          </button>
        </div>

        {/* Form Body Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 md:p-5 space-y-3.5 text-xs overflow-y-auto flex-1 overscroll-contain">
            {errorMessage && (
              <div className="bg-red-50 text-red-700 px-3 py-2 rounded-[6px] text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* 1. Nama Klien / Badan Usaha / Mandor */}
            <div>
              <label className="block text-[#666666] font-medium mb-1">
                Nama Klien / Badan Usaha / Mandor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: PT Maju Karya / Pak Haji Ridwan (Proyek Cilegon)"
                value={name}
                onChange={e => setName(formatClientNameLive(e.target.value))}
                onBlur={() => setName(formatClientName(name))}
                className="w-full bg-[#f5f5f5] focus:bg-[#ebebeb] outline-none rounded-[6px] px-3 py-2.5 text-xs text-[#111111] placeholder:text-[#999999] transition-colors"
              />
              <span className="text-[10px] text-[#888888] mt-1 block">
                Format nama otomatis rapi (Title Case). Tanda kurung ( ) diizinkan untuk keterangan proyek.
              </span>
            </div>

            {/* 2. Nama PIC / Mandor */}
            <div>
              <label className="block text-[#666666] font-medium mb-1">
                Nama PIC / Mandor Lapangan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Pak Joko / Mandor Proyek"
                value={picName}
                onChange={e => setPicName(formatPersonNameLive(e.target.value))}
                className="w-full bg-[#f5f5f5] focus:bg-[#ebebeb] outline-none rounded-[6px] px-3 py-2 text-xs text-[#111111] placeholder:text-[#999999] transition-colors"
              />
            </div>

            {/* 3. No. Telepon / WhatsApp */}
            <div>
              <label className="block text-[#666666] font-medium mb-1">
                No. Telepon / WhatsApp (Opsional)
              </label>
              <PhoneInput
                value={phoneNumber}
                onChange={setPhoneNumber}
                placeholder="8xx-xxxx-xxxx"
              />
            </div>
          </div>

          {/* Sticky Bottom Action Bar */}
          <div className="p-4 bg-white border-t border-[#eaeaea] sticky bottom-0 flex-shrink-0 flex items-center justify-end gap-3 z-10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 md:flex-none px-4 py-2.5 text-xs font-semibold text-[#666666] bg-[#f5f5f5] hover:bg-[#ebebeb] rounded-[8px] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 md:flex-none py-2.5 px-5 bg-[#111111] hover:bg-[#222222] active:bg-[#000000] text-white font-semibold text-xs rounded-[8px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
            >
              {isSubmitting ? 'Mendaftarkan...' : 'Simpan & Pilih Klien'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
