import React, { useState, useEffect, useCallback } from 'react';
import { 
    Table, Form, Input, Select, Button, Tag, Space, Card, 
    Row, Col, Modal, Typography, App as AntApp, Tabs, 
    Badge, Empty, Spin, Segmented, Alert, Tooltip
} from 'antd';
import { 
    PlusOutlined, HistoryOutlined, CheckCircleOutlined, 
    CloseCircleOutlined, InfoCircleOutlined, SendOutlined, ReloadOutlined 
} from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function RequestBarang() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [activeTab, setActiveTab] = useState(isAdmin ? 'pending' : 'form');
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [approveForm] = Form.useForm();
    const { message: antMessage, modal: antModal } = AntApp.useApp();

    // Data states
    const [history, setHistory] = useState<any[]>([]);
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [objekRSSubList, setObjekRSSubList] = useState<any[]>([]);
    const [satuanList, setSatuanList] = useState<any[]>([]);
    
    // Modal states
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (isAdmin) {
                const res = await fetch('/api/request-barang/all');
                if (res.ok) {
                    const data = await res.json();
                    setPendingRequests(data.filter((r: any) => r.Status === 'PENDING'));
                    setHistory(data);
                }
            } else {
                const res = await fetch('/api/request-barang/history');
                if (res.ok) setHistory(await res.json());
            }
        } catch (error) {
            antMessage.error('Gagal mengambil data');
        } finally {
            setLoading(false);
        }
    }, [isAdmin, antMessage]);

    const fetchMasterData = useCallback(async () => {
        try {
            const [resObj, resSat] = await Promise.all([
                fetch('/api/master/objek-rssub'),
                fetch('/api/master/satuan')
            ]);
            if (resObj.ok) setObjekRSSubList(await resObj.json());
            if (resSat.ok) setSatuanList(await resSat.json());
        } catch (error) {
            console.error('Master data fetch error:', error);
        }
    }, []);

    useEffect(() => {
        fetchData();
        fetchMasterData();
    }, [fetchData, fetchMasterData]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await fetch('/api/request-barang/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });
            if (res.ok) {
                antMessage.success('Permintaan berhasil dikirim');
                form.resetFields();
                fetchData();
                setActiveTab('history');
            } else {
                const data = await res.json();
                antMessage.error(data.error || 'Gagal mengirim permintaan');
            }
        } catch (error) {
            antMessage.error('Terjadi kesalahan network');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (values: any) => {
        setLoading(true);
        try {
            const res = await fetch('/api/request-barang/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    RequestID: selectedRequest.RequestID,
                    IDPLU_Req: values.IDPLU_Req
                }),
            });
            if (res.ok) {
                antMessage.success('Permintaan berhasil disetujui');
                setApproveModalOpen(false);
                approveForm.resetFields();
                fetchData();
            } else {
                const data = await res.json();
                antMessage.error(data.error || 'Gagal menyetujui permintaan');
            }
        } catch (error) {
            antMessage.error('Terjadi kesalahan network');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = (req: any) => {
        let catatan = '';
        antModal.confirm({
            title: 'Tolak Permintaan',
            content: (
                <div style={{ marginTop: 16 }}>
                    <Text>Berikan alasan penolakan:</Text>
                    <TextArea 
                        rows={3} 
                        onChange={(e) => catatan = e.target.value} 
                        placeholder="Contoh: Nama barang tidak sesuai standar"
                        style={{ marginTop: 8 }}
                    />
                </div>
            ),
            okText: 'Tolak',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                if (!catatan.trim()) {
                    antMessage.warning('Harap isi catatan penolakan');
                    return Promise.reject();
                }
                const res = await fetch('/api/request-barang/reject', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ RequestID: req.RequestID, CatatanAdmin: catatan }),
                });
                if (res.ok) {
                    antMessage.success('Permintaan ditolak');
                    fetchData();
                }
            }
        });
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'PENDING': return <Tag color="blue">MENUNGGU</Tag>;
            case 'APPROVED': return <Tag color="green">DISETUJUI</Tag>;
            case 'REJECTED': return <Tag color="red">DITOLAK</Tag>;
            default: return <Tag>{status}</Tag>;
        }
    };

    const historyColumns = [
        { title: 'Tgl', dataIndex: 'CreatedAt', key: 'CreatedAt', render: (val: any) => new Date(val).toLocaleDateString(), width: 100 },
        { 
            title: isAdmin ? 'User / OPD' : 'Akun (ObjekRSSub)', 
            key: 'user_opd', 
            render: (_: any, record: any) => isAdmin ? (
                <div>
                    <Text strong>{record.Username}</Text>
                    <div style={{ fontSize: 11, color: '#888' }}>{record.OPDName || '-'}</div>
                </div>
            ) : (
                <Text>{record.KetObjekRSSub}</Text>
            )
        },
        { title: 'Barang', dataIndex: 'Keterangan', key: 'Keterangan', strong: true },
        { title: 'Satuan', dataIndex: 'Satuan', key: 'Satuan', width: 90 },
        { 
            title: 'Tipe', 
            dataIndex: 'StaID', 
            key: 'StaID', 
            render: (val: string, record: any) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text code style={{ fontSize: 11 }}>{val}</Text>
                    {record.IDPLU_Req && <Text type="secondary" style={{ fontSize: 10 }}>{record.IDPLU_Req}</Text>}
                </div>
            )
        },
        { title: 'Status', dataIndex: 'Status', key: 'Status', render: (val: string) => getStatusTag(val) },
        { 
            title: 'Catatan Admin', 
            dataIndex: 'CatatanAdmin', 
            key: 'CatatanAdmin', 
            width: 220,
            render: (val: string) => val ? (
                <Text ellipsis={{ tooltip: { title: val, color: 'blue' } }} style={{ width: 200, display: 'inline-block' }}>
                    {val}
                </Text>
            ) : '-'
        },
    ];

    const adminColumns = [
        { title: 'Tgl Submit', dataIndex: 'CreatedAt', key: 'CreatedAt', render: (val: any) => new Date(val).toLocaleString(), width: 150 },
        { title: 'User / OPD', key: 'user', render: (_: any, record: any) => (
            <div>
                <Text strong>{record.Username}</Text>
                <div style={{ fontSize: 11, color: '#888' }}>{record.OPDName || '-'}</div>
            </div>
        )},
        { title: 'Detail Barang', key: 'detail', render: (_: any, record: any) => (
            <div>
                <div style={{ fontSize: 12, color: '#2F54EB' }}>[{record.ObjekRSSub}] {record.KetObjekRSSub}</div>
                <Text strong>{record.Keterangan}</Text>
                <div style={{ fontSize: 12 }}>Satuan: {record.Satuan} | Tipe: {record.StaID}</div>
                {record.IDPLU_Req && <Text type="secondary" style={{ fontSize: 11 }}>Req ID: {record.IDPLU_Req}</Text>}
            </div>
        )},
        { 
            title: 'Aksi', 
            key: 'action', 
            fixed: 'right' as const,
            width: 100,
            align: 'center' as const,
            render: (_: any, record: any) => (
                <Space size="small">
                    <Tooltip title="Approve Permintaan">
                        <Button 
                            type="primary" 
                            shape="circle"
                            icon={<CheckCircleOutlined />} 
                            onClick={() => {
                                setSelectedRequest(record);
                                setApproveModalOpen(true);
                                approveForm.setFieldsValue({ IDPLU_Req: record.IDPLU_Req });
                            }}
                            style={{ 
                                background: 'linear-gradient(90deg, #52c41a, #73d13d)', 
                                border: 'none', 
                                boxShadow: '0 2px 8px rgba(82, 196, 26, 0.2)' 
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Tolak Permintaan">
                        <Button 
                            danger 
                            shape="circle"
                            icon={<CloseCircleOutlined />} 
                            onClick={() => handleReject(record)}
                        />
                    </Tooltip>
                </Space>
            )
        },
    ];

    return (
        <div>
            <div style={{ overflow: 'hidden' }}>
                {/* Header Section */}
                <div style={{ 
                    padding: '24px 32px', 
                    borderBottom: '1px solid var(--ant-color-border-secondary, #f0f0f0)'
                }}>
                    <Row justify="space-between" align="middle" gutter={[16, 16]}>
                        <Col xs={24} sm={16}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <Title level={3} style={{ 
                                    margin: 0, 
                                    fontWeight: 700,
                                    background: 'linear-gradient(90deg, #1890ff 0%, #722ed1 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}>
                                    {isAdmin ? 'Manajemen Request Kode Barang' : 'Request Kode Barang Baru'}
                                </Title>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {isAdmin 
                                        ? 'Kelola persetujuan pengajuan kode barang dan PLU dari pengguna.' 
                                        : 'Ajukan permintaan kode barang atau PLU baru Anda di sini.'}
                                </Text>
                            </div>
                        </Col>
                        <Col xs={24} sm={8} style={{ textAlign: 'right' }}>
                            <Button 
                                type="primary" 
                                ghost 
                                icon={<ReloadOutlined />} 
                                onClick={fetchData} 
                                loading={loading}
                                size="large"
                                style={{ borderRadius: 8, width: '100%', maxWidth: 140 }}
                            >
                                Refresh
                            </Button>
                        </Col>
                    </Row>
                </div>

                <div style={{ padding: '0 24px 24px' }}>
                    <Tabs 
                        activeKey={activeTab} 
                        onChange={setActiveTab}
                        size="large"
                        tabBarStyle={{ marginBottom: 24, paddingTop: 16 }}
                        items={[
                            ...(isAdmin ? [
                                {
                                    key: 'pending',
                                    label: (
                                        <Badge count={pendingRequests.length} offset={[16, 0]} size="small" color="#f5222d">
                                            <span style={{ paddingRight: 8, fontWeight: 500 }}><InfoCircleOutlined /> Menunggu Persetujuan</span>
                                        </Badge>
                                    ),
                                    children: (
                                        <Card bordered={false} style={{ borderRadius: 12 }} className="table-card-wrapper">
                                            <Table 
                                                columns={adminColumns} 
                                                dataSource={pendingRequests} 
                                                rowKey="RequestID" 
                                                loading={loading}
                                                scroll={{ x: 900 }}
                                                pagination={{ pageSize: 10 }}
                                            />
                                        </Card>
                                    )
                                }
                            ] : [
                                {
                                    key: 'form',
                                    label: (<span style={{ fontWeight: 500 }}><PlusOutlined /> Request Form</span>),
                                    children: (
                                        <div style={{ maxWidth: 680, margin: '24px auto' }}>
                                            <Card 
                                                bordered={false}
                                                style={{ 
                                                    borderRadius: 16,
                                                    background: 'var(--ant-color-fill-alter, #fafafa)',
                                                    border: '1px solid var(--ant-color-border-secondary, #f0f0f0)'
                                                }}
                                                styles={{ 
                                                    header: { padding: '20px 24px', borderBottom: '1px solid var(--ant-color-border-secondary, #f0f0f0)' },
                                                    body: { padding: '32px 24px' }
                                                }}
                                                title={
                                                    <Space>
                                                        <div style={{ padding: 8, background: 'rgba(24, 144, 255, 0.15)', borderRadius: 8, display: 'flex' }}>
                                                            <PlusOutlined style={{ color: '#1890ff', fontSize: 16 }} />
                                                        </div>
                                                        <Text strong style={{ fontSize: 16, letterSpacing: 0.5 }}>Form Pengajuan</Text>
                                                    </Space>
                                                }
                                            >
                                                <Form 
                                                    form={form} 
                                                    layout="vertical" 
                                                    onFinish={onFinish}
                                                    initialValues={{ StaID: 'NON' }}
                                                    requiredMark="optional"
                                                    size="large"
                                                >
                                                    <Form.Item 
                                                        name="ObjekRSSub" 
                                                        label={<Text strong>Akun Persediaan</Text>}
                                                        rules={[{ required: true, message: 'Harap pilih akun' }]}
                                                    >
                                                        <Select 
                                                            showSearch
                                                            placeholder="-- Silahkan Pilih Akun Persediaan --"
                                                            optionFilterProp="children"
                                                            filterOption={(input, option: any) =>
                                                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                            }
                                                            options={objekRSSubList.map(item => ({
                                                                value: item.ObjekRSSub,
                                                                label: `[${item.ObjekRSSub}] ${item.KetObjekRSSub}`
                                                            }))}
                                                        />
                                                    </Form.Item>

                                                    <Form.Item name="StaID" label={<Text strong>Jenis Pengajuan</Text>}>
                                                        <Segmented 
                                                            block
                                                            size="large"
                                                            options={[
                                                                { label: 'Input PLU Manual', value: 'PLU' },
                                                                { label: 'Barang Baru (NON)', value: 'NON' },
                                                            ]} 
                                                        />
                                                    </Form.Item>

                                                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.StaID !== curr.StaID}>
                                                        {({ getFieldValue }) => getFieldValue('StaID') === 'PLU' ? (
                                                            <Form.Item 
                                                                name="IDPLU_Req" 
                                                                label={<Text strong>ID PLU <Text type="secondary">(Wajib untuk PLU)</Text></Text>}
                                                                rules={[{ required: true, message: 'Harap isi ID PLU' }]}
                                                            >
                                                                <Input placeholder="Contoh: 12345" />
                                                            </Form.Item>
                                                        ) : null}
                                                    </Form.Item>

                                                    <Form.Item 
                                                        name="Keterangan" 
                                                        label={<Text strong>Nama/Deskripsi Barang</Text>}
                                                        rules={[{ required: true, message: 'Harap isi nama barang' }]}
                                                    >
                                                        <Input placeholder="Contoh: Kertas HVS A4 80gr" />
                                                    </Form.Item>

                                                    <Form.Item 
                                                        name="Satuan" 
                                                        label={<Text strong>Satuan Barang</Text>}
                                                        rules={[{ required: true, message: 'Harap pilih satuan' }]}
                                                        style={{ marginBottom: 32 }}
                                                    >
                                                        <Select 
                                                            showSearch
                                                            placeholder="-- Silahkan Pilih Satuan --"
                                                            options={satuanList.map(item => ({
                                                                value: item.Satuan,
                                                                label: item.Satuan
                                                            }))}
                                                        />
                                                    </Form.Item>

                                                    <Form.Item style={{ marginBottom: 0 }}>
                                                        <Button 
                                                            type="primary" 
                                                            htmlType="submit" 
                                                            icon={<SendOutlined />} 
                                                            block 
                                                            loading={loading}
                                                            size="large"
                                                            style={{ 
                                                                height: 48, 
                                                                borderRadius: 8, 
                                                                fontSize: 16,
                                                                fontWeight: 600,
                                                                background: 'linear-gradient(90deg, #1890ff, #2f54eb)',
                                                                border: 'none',
                                                                boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)'
                                                            }}
                                                        >
                                                            Kirim Permintaan
                                                        </Button>
                                                    </Form.Item>
                                                </Form>
                                            </Card>
                                            <div style={{ marginTop: 24, textAlign: 'center' }}>
                                                <AlertInfo text="Admin akan meninjau permintaan Anda. Notifikasi akan muncul di lonceng saat status berubah." />
                                            </div>
                                        </div>
                                    )
                                }
                            ]),
                            {
                                key: 'history',
                                label: (<span style={{ fontWeight: 500 }}><HistoryOutlined /> {isAdmin ? 'Semua Riwayat' : 'Riwayat Saya'}</span>),
                                children: (
                                    <Card bordered={false} style={{ borderRadius: 12 }}>
                                        <Table 
                                            columns={historyColumns} 
                                            dataSource={history} 
                                            rowKey="RequestID" 
                                            loading={loading}
                                            scroll={{ x: 900 }}
                                            pagination={{ pageSize: 15 }}
                                            locale={{ emptyText: isAdmin ? <Empty description="Belum ada riwayat pengajuan" image={Empty.PRESENTED_IMAGE_SIMPLE} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                                        />
                                    </Card>
                                )
                            }
                        ]}
                    />
                </div>

                {/* Approval Modal */}
                <Modal
                    title={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} />Konfirmasi Persetujuan</Space>}
                    open={approveModalOpen}
                    onOk={() => approveForm.submit()}
                    onCancel={() => setApproveModalOpen(false)}
                    confirmLoading={loading}
                    okText="Setujui"
                    okButtonProps={{ type: 'primary', style: { background: '#52c41a', borderColor: '#52c41a' } }}
                    centered
                    bodyStyle={{ padding: '24px 0 0' }}
                >
                    <div style={{ marginBottom: 24 }}>
                        <Paragraph>Anda akan menyetujui permintaan berikut:</Paragraph>
                        <Card size="small" variant="borderless" style={{ background: 'var(--ant-color-fill-tertiary, rgba(0,0,0,0.04))' }}>
                            <Text strong style={{ fontSize: 16 }}>{selectedRequest?.Keterangan}</Text>
                            <div style={{ marginTop: 8 }}>
                                <Tag color="blue">{selectedRequest?.Satuan}</Tag>
                                <Tag color="purple">{selectedRequest?.StaID}</Tag>
                            </div>
                        </Card>
                    </div>
                    <Form form={approveForm} layout="vertical" size="large" onFinish={handleApprove}>
                        <Form.Item 
                            name="IDPLU_Req" 
                            label={<Text strong>Final ID PLU</Text>}
                            extra={
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    <InfoCircleOutlined style={{ marginRight: 4 }} />
                                    {selectedRequest?.StaID === 'NON' ? 'ID PLU akan di-generate otomatis jika dikosongkan' : 'Inputkan ID PLU yang akan digunakan'}
                                </Text>
                            }
                            rules={selectedRequest?.StaID === 'PLU' ? [{ required: true, message: 'Harap isi ID PLU' }] : []}
                        >
                            <Input placeholder={selectedRequest?.StaID === 'NON' ? 'Dikosongkan = Otomatis' : 'Input ID PLU'} />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
}

function AlertInfo({ text }: { text: string }) {
    return (
        <Alert 
            message={<span style={{ fontSize: 14 }}>{text}</span>} 
            type="info" 
            showIcon 
            style={{ 
                borderRadius: 12, 
                display: 'inline-flex',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
        />
    );
}
