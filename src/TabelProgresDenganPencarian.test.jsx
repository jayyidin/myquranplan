import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TabelProgresDenganPencarian from '../TabelProgresDenganPencarian';

describe('Komponen TabelProgresDenganPencarian', () => {
  const mockStudents = [
    { id: '1', name: 'Ahmad Zaki' },
    { id: '2', name: 'Siti Aminah' },
    { id: '3', name: 'Zaid bin Tsabit' }
  ];

  it('1. Harus merender daftar semua siswa saat pertama kali dimuat', () => {
    render(<TabelProgresDenganPencarian students={mockStudents} onOpenModal={() => {}} />);
    
    // Ekspektasi: Ketiga nama siswa harus muncul di layar
    expect(screen.getByText('Ahmad Zaki')).toBeInTheDocument();
    expect(screen.getByText('Siti Aminah')).toBeInTheDocument();
    expect(screen.getByText('Zaid bin Tsabit')).toBeInTheDocument();
  });

  it('2. Harus menampilkan pesan kosong jika array students kosong', () => {
    render(<TabelProgresDenganPencarian students={[]} onOpenModal={() => {}} />);
    
    expect(screen.getByText(/Tidak ada siswa dalam halaqoh ini/i)).toBeInTheDocument();
  });

  it('3. Harus bisa memfilter siswa berdasarkan input pencarian', () => {
    render(<TabelProgresDenganPencarian students={mockStudents} onOpenModal={() => {}} />);
    
    const searchInput = screen.getByPlaceholderText(/Cari dari 3 siswa/i);
    
    // Simulasi user mengetik "siti"
    fireEvent.change(searchInput, { target: { value: 'siti' } });
    
    // Ekspektasi: Siti Aminah muncul, Ahmad Zaki dan Zaid hilang
    expect(screen.getByText('Siti Aminah')).toBeInTheDocument();
    expect(screen.queryByText('Ahmad Zaki')).not.toBeInTheDocument();
    expect(screen.queryByText('Zaid bin Tsabit')).not.toBeInTheDocument();
  });

  it('4. Harus memanggil fungsi onOpenModal dengan parameter yang benar saat tombol Input diklik', () => {
    const mockOnOpenModal = vi.fn(); // Membuat fungsi tiruan (mock function)
    render(<TabelProgresDenganPencarian students={mockStudents} onOpenModal={mockOnOpenModal} />);
    
    // Ambil semua tombol "Input" (kita tahu ada 4 tombol per siswa: Tahsin, Tahfidz, Murojaah, Catatan)
    const inputButtons = screen.getAllByRole('button', { name: /Input/i });
    
    // Simulasi klik tombol "Input" pertama (Tahsin untuk Ahmad Zaki)
    fireEvent.click(inputButtons[0]);
    
    // Ekspektasi: Fungsi onOpenModal dipanggil dengan (studentObject, 'tahsin')
    expect(mockOnOpenModal).toHaveBeenCalledTimes(1);
    expect(mockOnOpenModal).toHaveBeenCalledWith(mockStudents[0], 'tahsin');
  });
});
