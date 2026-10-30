import React, { useState } from 'react';
import { Client } from '@/types/database';
import { updateClient, formatClientName, formatClientNameLive } from '@/lib/clientService';
import { formatPersonName, formatPersonNameLive } from '@/lib/nameUtils';
import { CustomDialog } from '@/components/ui/CustomDialog';
import { PinAuthModal } from '@/components/ui/PinAuthModal';
import { PhoneInput } from '@/components/ui/PhoneInput';

interface EditClientModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditClientModal({
  client,
  isOpen,
  onClose,
  onSuccess
}: EditClientModalProps): React.JSX.Element {
  const [name, setName] = useState(client.name);
  const [picName, setPicName] = useState(client.picName || '');
  const [phoneNumber, setPhoneNumber] = useState(client.phoneNumber || '');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsPinModalOpen(true);
  };

  const handleAuthorizedSave = async (): Promise<void> => {
    setIsSubmitting(true);
    try {
      await updateClient(client.id, {
        name: formatClientName(name),
        picName: formatPersonName(picName),
        phoneNumber: phoneNumber.trim()
      });
      setIsPinModalOpen(false);
      onSuccess();
    } catch (err) {
      console.error('Gagal memperbarui data klien:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CustomDialog
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Data Klien"
        description={`Koreksi informasi kontak dan PIC mitra klien ${client.name}.`}
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-xs pt-2">
          <div>
            <label className="block text-[#666666] font-medium mb-1">
              Nama Perusahaan / Klien <span className="text-[#cf1124]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(formatClientNameLive(e.target.value))}
              required
              placeholder="Contoh: PT Wijaya Karya atau Mandor Hasan"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">PIC Lapangan</label>
            <input
              type="text"
              value={picName}
              onChange={e => setPicName(formatPersonNameLive(e.target.value))}
              placeholder="Nama penanggung jawab lapangan"
              className="w-full bg-white border border-[#eaeaea] rounded-[8px] px-3.5 py-2 text-xs focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#666666] font-medium mb-1">Nomor HP / WhatsApp</label>
            <PhoneInput
              value={phoneNumber}
              onChange={setPhoneNumber}
              placeholder="81234567890"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#eaeaea]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-2 rounded-[8px] border border-[#eaeaea] text-[#666666] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 rounded-[8px] bg-[#111111] hover:bg-black text-white font-medium transition-colors cursor-pointer disabled:opacity-50"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </CustomDialog>

      <PinAuthModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleAuthorizedSave}
        title="Otorisasi Ubah Data Klien"
        description={`Masukkan PIN otorisasi untuk menyimpan perubahan data klien "${client.name}".`}
      />
    </>
  );
}
