import React, { useState, useEffect, useCallback } from 'react';
import { Badge, Popover, List, Button, Typography, Space, App } from 'antd';
import { BellOutlined, CheckOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { notification: antNotification } = App.useApp();

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications/unread');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        // Polling every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (id?: number) => {
        setLoading(true);
        try {
            const res = await fetch('/api/notifications/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ NotificationID: id }),
            });
            if (res.ok) {
                fetchNotifications();
                if (!id) {
                    antNotification.success({
                        message: 'Berhasil',
                        description: 'Semua notifikasi ditandai telah dibaca',
                    });
                }
            }
        } catch (error) {
            console.error('Failed to mark read:', error);
        } finally {
            setLoading(false);
        }
    };

    const notificationContent = (
        <div style={{ width: 300 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>Notifikasi Baru</Text>
                {notifications.length > 0 && (
                    <Button type="link" size="small" onClick={() => markAsRead()} loading={loading}>
                        Baca Semua
                    </Button>
                )}
            </div>
            <List
                dataSource={notifications}
                locale={{ emptyText: 'Tidak ada notifikasi baru' }}
                renderItem={(item) => (
                    <List.Item
                        key={item.NotificationID}
                        actions={[
                            <Button type="text" size="small" icon={<CheckOutlined />} onClick={() => markAsRead(item.NotificationID)} />
                        ]}
                    >
                        <List.Item.Meta
                            avatar={<InfoCircleOutlined style={{ color: '#2F54EB', marginTop: 4 }} />}
                            description={
                                <div>
                                    <Text style={{ fontSize: 13 }}>{item.Message}</Text>
                                    <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                                        {new Date(item.CreatedAt).toLocaleString()}
                                    </div>
                                </div>
                            }
                        />
                    </List.Item>
                )}
                style={{ maxHeight: 400, overflowY: 'auto' }}
            />
        </div>
    );

    return (
        <Popover
            content={notificationContent}
            trigger="click"
            placement="bottomRight"
            arrow={{ pointAtCenter: true }}
        >
            <Badge count={notifications.length} offset={[-2, 6]} size="small">
                <Button
                    type="text"
                    icon={<BellOutlined style={{ fontSize: 20 }} />}
                    style={{ height: 40, width: 40 }}
                />
            </Badge>
        </Popover>
    );
}
