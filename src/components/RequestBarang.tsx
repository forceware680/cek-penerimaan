import React, { useState, useEffect, useCallback } from 'react';
import { 
    Table, Form, Input, Select, Button, Tag, Space, Card, 
    Row, Col, Modal, Typography, App as AntApp, Tabs, 
    Badge, Empty, Spin, Segmented, Alert
} from 'antd';
import { 
    PlusOutlined, HistoryOutlined, CheckCircleOutlined, 
    CloseCircleOutlined, InfoCircleOutlined, SendOutlined 
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
                <Space direction="vertical" size={0}>
                    <Text code style={{ fontSize: 11 }}>{val}</Text>
                    {record.IDPLU_Req && <Text type="secondary" style={{ fontSize: 10 }}>{record.IDPLU_Req}</Text>}
                </Space>
            )
        },
        { title: 'Status', dataIndex: 'Status', key: 'Status', render: (val: string) => getStatusTag(val) },
        { title: 'Catatan Admin', dataIndex: 'CatatanAdmin', key: 'CatatanAdmin', ellipsis: true },
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
            width: 150,
            render: (_: any, record: any) => (
                <Space>
                    <Button 
                        type="primary" 
                        icon={<CheckCircleOutlined />} 
                        onClick={() => {
                            setSelectedRequest(record);
                            setApproveModalOpen(true);
                            approveForm.setFieldsValue({ IDPLU_Req: record.IDPLU_Req });
                        }}
                    >
                        Approve
                    </Button>
                    <Button 
                        danger 
                        icon={<CloseCircleOutlined />} 
                        onClick={() => handleReject(record)}
                    >
                        Reject
                    </Button>
                </Space>
            )
        },
    ];

    return (
        <Card bordered={false} styles={{ body: { padding: 0 } }}>
            <div style={{ padding: '0 16px 16px' }}>
                <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                    <Col>
                        <Title level={4} style={{ margin: 0 }}>
                            {isAdmin ? 'Manajemen Request Kode Barang' : 'Request Kode Barang Baru'}
                        </Title>
                    </Col>
                    <Col>
                        <Button icon={<HistoryOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
                    </Col>
                </Row>

                <Tabs 
                    activeKey={activeTab} 
                    onChange={setActiveTab}
                    items={[
                        ...(isAdmin ? [
                            {
                                key: 'pending',
                                label: (
                                    <Badge count={pendingRequests.length} offset={[12, 0]} size="small">
                                        Pending Request
                                    </Badge>
                                ),
                                children: (
                                    <Table 
                                        columns={adminColumns} 
                                        dataSource={pendingRequests} 
                                        rowKey="RequestID" 
                                        loading={loading}
                                        scroll={{ x: 800 }}
                                    />
                                )
                            }
                        ] : [
                            {
                                key: 'form',
                                label: (<span><PlusOutlined /> Request Form</span>),
                                children: (
                                    <div style={{ maxWidth: 600, margin: '20px auto' }}>
                                        <Card title="Form Pengajuan" size="small">
                                            <Form 
                                                form={form} 
                                                layout="vertical" 
                                                onFinish={onFinish}
                                                initialValues={{ StaID: 'NON' }}
                                            >
                                                <Form.Item 
                                                    name="ObjekRSSub" 
                                                    label="Akun Persediaan" 
                                                    rules={[{ required: true, message: 'Harap pilih akun' }]}
                                                >
                                                    <Select 
                                                        showSearch
                                                        placeholder="Pilih Akun Persediaan"
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

                                                <Form.Item name="StaID" label="Jenis Pengajuan">
                                                    <Segmented 
                                                        block
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
                                                            label="ID PLU (Wajib Untuk PLU)" 
                                                            rules={[{ required: true, message: 'Harap isi ID PLU' }]}
                                                        >
                                                            <Input placeholder="Contoh: 12345" />
                                                        </Form.Item>
                                                    ) : null}
                                                </Form.Item>

                                                <Form.Item 
                                                    name="Keterangan" 
                                                    label="Nama/Deskripsi Barang" 
                                                    rules={[{ required: true, message: 'Harap isi nama barang' }]}
                                                >
                                                    <Input placeholder="Contoh: Kertas HVS A4 80gr" />
                                                </Form.Item>

                                                <Form.Item 
                                                    name="Satuan" 
                                                    label="Satuan" 
                                                    rules={[{ required: true, message: 'Harap pilih satuan' }]}
                                                >
                                                    <Select 
                                                        showSearch
                                                        placeholder="Pilih Satuan"
                                                        options={satuanList.map(item => ({
                                                            value: item.Satuan,
                                                            label: item.Satuan
                                                        }))}
                                                    />
                                                </Form.Item>

                                                <Form.Item>
                                                    <Button type="primary" htmlType="submit" icon={<SendOutlined />} block loading={loading}>
                                                        Kirim Permintaan
                                                    </Button>
                                                </Form.Item>
                                            </Form>
                                        </Card>
                                        <div style={{ marginTop: 16 }}>
                                            <AlertInfo text="Admin akan meninjau permintaan Anda. Notifikasi akan muncul di lonceng saat status berubah." />
                                        </div>
                                    </div>
                                )
                            }
                        ]),
                        {
                            key: 'history',
                            label: (<span><HistoryOutlined /> {isAdmin ? 'Semua Riwayat' : 'Riwayat Saya'}</span>),
                            children: (
                                <Table 
                                    columns={historyColumns} 
                                    dataSource={history} 
                                    rowKey="RequestID" 
                                    loading={loading}
                                    scroll={{ x: 800 }}
                                    locale={{ emptyText: isAdmin ? <Empty description="Belum ada riwayat pengajuan" /> : <Empty /> }}
                                />
                            )
                        }
                    ]}
                />
            </div>

            {/* Approval Modal */}
            <Modal
                title="Konfirmasi Persetujuan"
                open={approveModalOpen}
                onOk={() => approveForm.submit()}
                onCancel={() => setApproveModalOpen(false)}
                confirmLoading={loading}
                okText="Setujui"
            >
                <div style={{ marginBottom: 16 }}>
                    <Paragraph>Anda akan menyetujui permintaan berikut:</Paragraph>
                    <Card size="small" type="inner">
                        <Text strong>{selectedRequest?.Keterangan}</Text>
                        <br />
                        <Text type="secondary">{selectedRequest?.Satuan} | {selectedRequest?.StaID}</Text>
                    </Card>
                </div>
                <Form form={approveForm} layout="vertical" onFinish={handleApprove}>
                    <Form.Item 
                        name="IDPLU_Req" 
                        label="Final ID PLU" 
                        extra={selectedRequest?.StaID === 'NON' ? 'ID PLU akan di-generate otomatis jika dikosongkan' : 'Inputkan ID PLU yang akan digunakan'}
                        rules={selectedRequest?.StaID === 'PLU' ? [{ required: true, message: 'Harap isi ID PLU' }] : []}
                    >
                        <Input placeholder={selectedRequest?.StaID === 'NON' ? 'Otomatis' : 'Input ID PLU'} />
                    </Form.Item>
                </Form>
            </Modal>
        </Card>
    );
}

function AlertInfo({ text }: { text: string }) {
    return (
        <Alert 
            message={<span style={{ fontSize: 13 }}>{text}</span>} 
            type="info" 
            showIcon 
            style={{ borderRadius: 8 }}
        />
    );
}
