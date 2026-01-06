'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Table,
    Spin,
    Button,
    message,
    Modal,
    Input,
    DatePicker,
    Typography,
    Space,
    Tooltip,
    Dropdown,
} from 'antd';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs, { Dayjs } from 'dayjs';
import {
    DatabaseOutlined,
    DeleteOutlined,
    ShoppingCartOutlined,
    WalletOutlined,
    SyncOutlined,
    FileExcelOutlined,
    FileTextOutlined,
    LineChartOutlined,
    DollarOutlined,
    PieChartOutlined,
    FundOutlined,
} from '@ant-design/icons';
import PBSubkData from '@/data/PBSubk.json';
import { useAuth } from '@/context/AuthContext';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface DataRecord {
    NoTerima: string;
    ObjekPersediaan: string;
    NamaBarang: string;
    Satuan: string;
    MerkType: string;
    Jumlah: number;
    Harga: string;
    TotalHarga: string;
    BAST: string;
    TglInput: string;
    Kadaluwarsa: string;
    NoBAST: string;
    Keterangan: string;
    TipeSaldo: string;
    FIFO: string;
    NoKel: string;
}

interface PBSubkRecord {
    PBSubk?: string;
    PBSubK?: string;
    KetPBSubk: string;
}

export default function TempPersediaanStep1Table() {
    const { user } = useAuth();
    const [data, setData] = useState<DataRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isRekapVisible, setRekapVisible] = useState(false);
    const [emptying, setEmptying] = useState(false);
    const [pageSize, setPageSize] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [initialBalance, setInitialBalance] = useState(0);
    const [runningBalance, setRunningBalance] = useState(0);
    const [saldoLainLain, setSaldoLainLain] = useState(0);
    const [SaldoAwalSem2, setSaldoAwalSem2] = useState(0);
    const [totalQuantity, setTotalQuantity] = useState(0);
    const [totalHarga, setTotalHarga] = useState(0);
    const [selectedAction, setSelectedAction] = useState<string | null>(null);
    const [filterNoTerima, setFilterNoTerima] = useState('');
    const [suggestions, setSuggestions] = useState<PBSubkRecord[]>([]);

    const fiscalYearv2 = parseInt(localStorage.getItem('fiscalYear') || String(dayjs().year()));
    const [periode, setPeriode] = useState<[Dayjs, Dayjs]>([
        dayjs().year(fiscalYearv2).startOf('year'),
        dayjs().year(fiscalYearv2).month(5).endOf('month').hour(23).minute(59).second(59)
    ]);
    const [namaPBSubk, setNamaPBSubk] = useState('');
    const [tempFilterNoTerima, setTempFilterNoTerima] = useState('');

    const fiscalYear = parseInt(localStorage.getItem('fiscalYear') || String(dayjs().year()));

    const rangePresets = [
        { label: 'Semester 1', value: [dayjs().year(fiscalYear).startOf('year'), dayjs().year(fiscalYear).month(5).endOf('month').hour(23).minute(59).second(59)] as [Dayjs, Dayjs] },
        { label: 'Semester 2', value: [dayjs().year(fiscalYear).month(6).startOf('month'), dayjs().year(fiscalYear).endOf('year').hour(23).minute(59).second(59)] as [Dayjs, Dayjs] },
        { label: 'Tahunan', value: [dayjs().year(fiscalYear).startOf('year'), dayjs().year(fiscalYear).endOf('year').hour(23).minute(59).second(59)] as [Dayjs, Dayjs] },
    ];

    const toDottedPB = (prefix16: string = ''): string => {
        const p = (prefix16 || '').slice(0, 16);
        if (p.length !== 16) return '';
        return `${p.slice(0, 6)}.${p.slice(6, 11)}.${p.slice(11, 16)}`;
    };

    const prefillFromLogin = useCallback(() => {
        if (!user || !user.filter) return;
        const prefix = String(user.filter).slice(0, 16);
        if (!prefix) return;
        setFilterNoTerima(prefix);
        setTempFilterNoTerima(prefix);

        try {
            const dotted = toDottedPB(prefix);
            const records = (PBSubkData as { RECORDS: PBSubkRecord[] }).RECORDS || [];
            const rec = records.find((r) => r.PBSubk === dotted || r.PBSubK === dotted);
            if (rec?.KetPBSubk) setNamaPBSubk(rec.KetPBSubk);
        } catch { }
    }, [user]);

    useEffect(() => {
        if (isModalVisible) prefillFromLogin();
    }, [isModalVisible, prefillFromLogin]);

    const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';

    const handleNamaPBSubkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const keyword = e.target.value;
        setNamaPBSubk(keyword);
        const records = (PBSubkData as { RECORDS: PBSubkRecord[] }).RECORDS || [];
        const filteredSuggestions = records.filter((item) =>
            item.KetPBSubk.toLowerCase().includes(keyword.toLowerCase())
        );
        setSuggestions(filteredSuggestions);
    };

    const handleSuggestionClick = (item: PBSubkRecord) => {
        const pbsubk = item.PBSubk || item.PBSubK || '';
        setTempFilterNoTerima(pbsubk);
        setFilterNoTerima(pbsubk);
        setSuggestions([]);
        setNamaPBSubk(item.KetPBSubk);
    };

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/temp-persediaan-step1?timestamp=${Date.now()}`, { credentials: 'include' });
            if (res.ok) {
                const rawData = await res.json();
                setData(rawData);
                setTotalRecords(rawData.length);
            }
        } catch (error) {
            message.error('Failed to load data.');
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchSummaryData = useCallback(async () => {
        try {
            const res = await fetch(`/api/saldo-data?timestamp=${Date.now()}`, { credentials: 'include' });
            if (res.ok) {
                const summaryData = await res.json();
                setInitialBalance(parseFloat(summaryData.initialBalance));
                setRunningBalance(parseFloat(summaryData.runningBalance));
                setSaldoLainLain(parseFloat(summaryData.saldoLainLain));
                setSaldoAwalSem2(parseFloat(summaryData.SaldoAwalSem2));
                setTotalQuantity(summaryData.totalQuantity);
                setTotalHarga(parseFloat(summaryData.totalHarga));
            }
        } catch (error) {
            console.error('Error fetching summary data:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchSummaryData();
    }, [fetchData, fetchSummaryData]);

    const handleDropdownChange = (value: string) => {
        setSelectedAction(value);
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            let endpoint = '';
            if (selectedAction === 'saldo_awal') endpoint = '/api/tarik-saldo-awal';
            else if (selectedAction === 'saldo_tahun_lalu') endpoint = '/api/tarik-saldo-tahun-lalu';
            else if (selectedAction === 'saldo_lain_lain') endpoint = '/api/tarik-saldo-lain-lain';
            else if (selectedAction === 'saldo_berjalan') endpoint = '/api/tarik-saldo-berjalan';
            else if (selectedAction === 'stockopname_insert') endpoint = '/api/stockopname-insert';

            const params = new URLSearchParams({
                filter_no_terima: filterNoTerima,
                periode_awal: periode[0]?.format('YYYY-MM-DD HH:mm:ss') || '',
                periode_akhir: periode[1]?.format('YYYY-MM-DD HH:mm:ss') || '',
            });

            const res = await fetch(`${endpoint}?${params}`, { credentials: 'include' });
            if (res.ok) {
                message.success('Data berhasil ditarik!');
                fetchData();
                fetchSummaryData();
                setIsModalVisible(false);
            } else {
                const errorData = await res.json();
                message.error(`Gagal: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            message.error('Gagal menarik data.');
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setFilterNoTerima(tempFilterNoTerima);
    };

    const handleEmptyTable = async () => {
        setEmptying(true);
        try {
            const res = await fetch('/api/empty-step1', { method: 'POST', credentials: 'include' });
            if (res.ok) {
                setData([]);
                setTotalRecords(0);
                setInitialBalance(0);
                setSaldoLainLain(0);
                setSaldoAwalSem2(0);
                setRunningBalance(0);
                setTotalQuantity(0);
                setTotalHarga(0);
                message.success('Semua record berhasil dihapus.');
            }
        } catch (error) {
            console.error('Error emptying table:', error);
            message.error('Gagal mengosongkan tabel. Coba lagi.');
        } finally {
            setEmptying(false);
        }
    };

    const cleanKetPBSubk = namaPBSubk
        .replace(/[^a-zA-Z0-9]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
    const periode_awal = periode && periode[0] ? periode[0].format('YYYY-MM-DD') : '';
    const periode_akhir = periode && periode[1] ? periode[1].format('YYYY-MM-DD') : '';

    const exportToExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('TempPersediaanStep1');

        worksheet.columns = [
            { header: 'No Terima', key: 'NoTerima', width: 20 },
            { header: 'Objek Persediaan', key: 'ObjekPersediaan', width: 25 },
            { header: 'Nama Barang', key: 'NamaBarang', width: 40 },
            { header: 'Satuan', key: 'Satuan', width: 12 },
            { header: 'Merk/Type', key: 'MerkType', width: 20 },
            { header: 'Jumlah', key: 'Jumlah', width: 12 },
            { header: 'Harga', key: 'Harga', width: 20 },
            { header: 'TotalHarga', key: 'TotalHarga', width: 20 },
            { header: 'Tgl BAST', key: 'TglBAST', width: 15 },
            { header: 'Tgl Input', key: 'TglInput', width: 15 },
            { header: 'Kadaluwarsa', key: 'Kadaluwarsa', width: 15 },
            { header: 'No BAST', key: 'NoBAST', width: 25 },
            { header: 'Keterangan', key: 'Keterangan', width: 30 },
            { header: 'Tipe Saldo', key: 'TipeSaldo', width: 15 },
            { header: 'FIFO', key: 'FIFO', width: 10 },
            { header: 'No Kel', key: 'NoKel', width: 10 },
        ];

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

        const exportData = data.map(row => ({
            ...row,
            Harga: parseFloat(row.Harga),
            TotalHarga: parseFloat(row.TotalHarga),
            TglBAST: row.BAST,
            TglInput: row.TglInput,
            Kadaluwarsa: row.Kadaluwarsa,
        }));

        worksheet.addRows(exportData);

        // Add Auto Filter to header row (columns A to P)
        worksheet.autoFilter = {
            from: 'A1',
            to: 'P1'
        };

        // Freeze first row (header) so it stays visible when scrolling
        worksheet.views = [
            { state: 'frozen', ySplit: 1, activeCell: 'A2', showGridLines: true }
        ];

        // Add Total row with SUM formulas
        const dataEndRow = data.length + 1; // +1 for header
        const totalRowNumber = dataEndRow + 1;

        const totalRow = worksheet.addRow({
            NoTerima: 'Total',
            ObjekPersediaan: '',
            NamaBarang: '',
            Satuan: '',
            MerkType: '',
            Jumlah: { formula: `SUM(F2:F${dataEndRow})` },
            Harga: { formula: `SUM(G2:G${dataEndRow})` },
            TotalHarga: { formula: `SUM(H2:H${dataEndRow})` },
            TglBAST: '',
            TglInput: '',
            Kadaluwarsa: '',
            NoBAST: '',
            Keterangan: '',
            TipeSaldo: '',
            FIFO: '',
            NoKel: '',
        });

        // Style the Total row
        totalRow.font = { bold: true };
        totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE2EFDA' }
        };

        // Format number columns
        worksheet.getColumn('Harga').numFmt = '#,##0.00';
        worksheet.getColumn('TotalHarga').numFmt = '#,##0.00';

        const fileName = `CP_${cleanKetPBSubk}_${periode_awal}_sd_${periode_akhir}.xlsx`;

        try {
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(blob, fileName);
            message.success('File Excel berhasil diekspor!');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            message.error('Gagal mengekspor file Excel.');
        }
    };

    const columns = [
        { title: 'No Terima', dataIndex: 'NoTerima', key: 'NoTerima', width: 150 },
        { title: 'Objek Persediaan', dataIndex: 'ObjekPersediaan', key: 'ObjekPersediaan', width: 150 },
        { title: 'Nama Barang', dataIndex: 'NamaBarang', key: 'NamaBarang', width: 200 },
        { title: 'Satuan', dataIndex: 'Satuan', key: 'Satuan', width: 80 },
        { title: 'Merk/Type', dataIndex: 'MerkType', key: 'MerkType', width: 120 },
        { title: 'Jumlah', dataIndex: 'Jumlah', key: 'Jumlah', width: 80 },
        { title: 'Harga', dataIndex: 'Harga', key: 'Harga', width: 120, render: (text: string) => parseFloat(text).toFixed(2) },
        { title: 'TotalHarga', dataIndex: 'TotalHarga', key: 'TotalHarga', width: 120, render: (text: string) => parseFloat(text).toFixed(2) },
        { title: 'BAST', dataIndex: 'BAST', key: 'BAST', width: 150, sorter: (a: DataRecord, b: DataRecord) => new Date(a.BAST).getTime() - new Date(b.BAST).getTime(), defaultSortOrder: 'ascend' as const },
        { title: 'Tgl Input', dataIndex: 'TglInput', key: 'TglInput', width: 150 },
        { title: 'Kadaluwarsa', dataIndex: 'Kadaluwarsa', key: 'Kadaluwarsa', width: 150 },
        { title: 'NoBAST', dataIndex: 'NoBAST', key: 'NoBAST', width: 150 },
        { title: 'Keterangan', dataIndex: 'Keterangan', key: 'Keterangan', width: 150 },
        {
            title: 'Tipe Saldo', dataIndex: 'TipeSaldo', key: 'TipeSaldo', width: 120,
            filters: [...new Set(data.map(item => item.TipeSaldo))].map(value => ({ text: value, value })),
            onFilter: (value: unknown, record: DataRecord) => record.TipeSaldo.includes(String(value)),
        },
        { title: 'FIFO', dataIndex: 'FIFO', key: 'FIFO', width: 150 },
        { title: 'NoKel', dataIndex: 'NoKel', key: 'NoKel', width: 150 },
    ];

    const dropdownItems = [
        { key: 'saldo_awal', label: <><WalletOutlined style={{ marginRight: 8 }} /> Saldo Awal</> },
        { key: 'saldo_tahun_lalu', label: <><FileTextOutlined style={{ marginRight: 8 }} /> Saldo Th Lalu</> },
        { key: 'saldo_lain_lain', label: <><FileTextOutlined style={{ marginRight: 8 }} /> Saldo Lain-lain</> },
        { key: 'saldo_berjalan', label: <><LineChartOutlined style={{ marginRight: 8 }} /> Saldo Berjalan</> },
        { key: 'stockopname_insert', label: <><PieChartOutlined style={{ marginRight: 8 }} /> Sisa Stock</> },
    ];

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Space wrap>
                    <Dropdown.Button
                        menu={{ items: dropdownItems, onClick: ({ key }) => handleDropdownChange(key) }}
                        size="middle"
                    >
                        Tarik Jenis Data
                    </Dropdown.Button>

                    <Tooltip title={data.length === 0 ? 'Tidak ada data' : 'Export ke Excel'}>
                        <Button
                            type="primary"
                            onClick={exportToExcel}
                            disabled={data.length === 0}
                            style={{ background: '#52c41a', borderColor: '#52c41a' }}
                            size="middle"
                        >
                            <FileExcelOutlined />
                            Export Excel
                        </Button>
                    </Tooltip>

                    <Button
                        type="primary"
                        danger
                        onClick={handleEmptyTable}
                        loading={emptying}
                        size="middle"
                    >
                        <DeleteOutlined />
                        Empty Table
                    </Button>

                    <Button
                        type="primary"
                        onClick={() => setRekapVisible(true)}
                        icon={<DatabaseOutlined />}
                        size="middle"
                    >
                        Rekap
                    </Button>
                </Space>
                <Typography.Text type="secondary">Total Records: {totalRecords}</Typography.Text>
            </div>

            {loading ? (
                <Spin tip="Loading data..." />
            ) : (
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey={(record, index) => `${record.NoTerima}-${index}`}
                    pagination={{
                        pageSize: pageSize,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100', '1000'],
                        onChange: (_, size) => setPageSize(size),
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                    }}
                    scroll={{ x: 1500, y: 500 }}
                    sticky={true}
                />
            )}

            <Modal
                title="Tarik Data Filter"
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
                okText="Tarik"
                cancelText="Batal"
                width={720}
            >
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                    {isAdmin && (
                        <div style={{ position: 'relative' }}>
                            <Typography.Text style={{ display: 'block', marginBottom: 6 }}>Nama PBSubk</Typography.Text>
                            <Input
                                placeholder="Nama PBSubk"
                                value={namaPBSubk}
                                onChange={handleNamaPBSubkChange}
                            />
                            {suggestions.length > 0 && (
                                <ul style={{ position: 'absolute', background: 'white', border: '1px solid #d9d9d9', borderRadius: 4, padding: 0, margin: 0, listStyle: 'none', maxHeight: 200, overflowY: 'auto', width: '100%', zIndex: 1000 }}>
                                    {suggestions.map((item, index) => (
                                        <li
                                            key={index}
                                            onClick={() => handleSuggestionClick(item)}
                                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
                                        >
                                            {item.KetPBSubk}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    <div>
                        <Typography.Text style={{ display: 'block', marginBottom: 6 }}>Filter No Terima</Typography.Text>
                        <Input
                            placeholder="Filter No Terima"
                            value={filterNoTerima}
                            onChange={(e) => setFilterNoTerima(e.target.value)}
                            readOnly={true}
                            className="readonly-input"
                        />
                    </div>

                    <div>
                        <Typography.Text style={{ display: 'block', marginBottom: 6 }}>Periode</Typography.Text>
                        <RangePicker
                            presets={rangePresets}
                            showTime
                            format="YYYY-MM-DD HH:mm:ss"
                            value={periode}
                            onChange={(dates) => dates && setPeriode(dates as [Dayjs, Dayjs])}
                            style={{ width: '100%' }}
                        />
                    </div>
                </Space>
            </Modal>

            <Modal
                title="Data Rekap"
                open={isRekapVisible}
                onCancel={() => setRekapVisible(false)}
                footer={null}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Text strong><DatabaseOutlined /> <span style={{ color: '#ff4d4f' }}>Records:</span> {totalRecords}</Text>
                        <Text strong><ShoppingCartOutlined /> <span style={{ color: '#ff4d4f' }}>Barang:</span> {totalQuantity.toLocaleString()}</Text>
                        <Text strong><WalletOutlined /> <span style={{ color: '#ff4d4f' }}>Saldo Awal:</span> {initialBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</Text>
                        <Text strong><SyncOutlined /> <span style={{ color: '#ff4d4f' }}>Saldo Berjalan:</span> {runningBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</Text>
                        <Text strong><WalletOutlined /> <span style={{ color: '#ff4d4f' }}>Saldo Lain-lain:</span> {saldoLainLain.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</Text>
                        <Text strong><FundOutlined /> <span style={{ color: '#ff4d4f' }}>Sisa Stock:</span> {SaldoAwalSem2.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</Text>
                        <Text strong><DollarOutlined /> <span style={{ color: '#ff4d4f' }}>Total Harga:</span> {totalHarga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</Text>
                    </Space>
                    <Button
                        type="primary"
                        block
                        onClick={() => {
                            navigator.clipboard.writeText(
                                `Records: ${totalRecords}\nBarang: ${totalQuantity.toLocaleString()}\nSaldo Awal: ${initialBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}\nSaldo Berjalan: ${runningBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}\nSaldo Lain-lain: ${saldoLainLain.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}\nSisa Stock: ${SaldoAwalSem2.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}\nTotal Harga: ${totalHarga.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}`
                            );
                            message.success('Data berhasil disalin');
                        }}
                    >
                        Copy
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
