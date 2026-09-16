'use client';

import React, { useState, useEffect } from 'react';
import {
    Layout,
    Menu,
    Row,
    Col,
    Button,
    ConfigProvider,
    App as AntApp,
    Tooltip,
    Drawer,
    Avatar,
    Typography,
    Dropdown,
} from 'antd';
import {
    UserOutlined,
    CheckOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    InfoCircleOutlined,
    LogoutOutlined,
    AppstoreAddOutlined,
} from '@/components/md-icons';
import TempPersediaanStep1Table from './TempPersediaanStep1Table';
import RequestBarang from './RequestBarang';
import NotificationBell from './NotificationBell';
import { useAuth } from '@/context/AuthContext';

const { Header, Content, Footer, Sider } = Layout;
const { Text } = Typography;

// Typewriter component
const Typewriter = ({ text, speed = 150, delay = 2000 }: { text: string; speed?: number; delay?: number }) => {
    const [displayText, setDisplayText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(speed);

    useEffect(() => {
        const handleTyping = () => {
            const fullText = text;
            setDisplayText(
                isDeleting
                    ? fullText.substring(0, displayText.length - 1)
                    : fullText.substring(0, displayText.length + 1)
            );
            setTypingSpeed(isDeleting ? speed / 2 : speed);
            if (!isDeleting && displayText === fullText) {
                setTimeout(() => setIsDeleting(true), delay);
            } else if (isDeleting && displayText === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
            }
        };
        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [displayText, isDeleting, loopNum, typingSpeed, text, speed, delay]);

    return (
        <span>
            {displayText}
            <span className="typewriter-cursor">|</span>
        </span>
    );
};

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [openNav, setOpenNav] = useState(false);
    const [currentMenu, setCurrentMenu] = useState('step1');
    const [fiscalYear] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('fiscalYear') || new Date().getFullYear().toString();
        }
        return new Date().getFullYear().toString();
    });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 992);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const menuItems = [
        {
            key: 'step1',
            icon: <CheckOutlined />,
            label: 'Cek Saldo Penerimaan',
        },
        {
            key: 'request-barang',
            icon: <AppstoreAddOutlined />,
            label: 'Request Kode Barang',
        },
    ];

    const handleMenuClick = (e: { key: string }) => {
        setCurrentMenu(e.key);
        if (isMobile) setOpenNav(false);
    };

    const renderSidebarFooter = (isDrawer = false) => {
        const onInkPanel = !isDrawer;

        return (
            <div style={isDrawer ? {} : { position: 'absolute', bottom: 24, left: 16, right: 16 }}>
                <div
                    style={{
                        height: '2px',
                        width: '100%',
                        background: onInkPanel ? 'rgba(255, 255, 255, 0.15)' : '#e4ddc9',
                        marginBottom: '16px',
                    }}
                />

                {(!collapsed || isDrawer) && (
                    <div style={{ textAlign: 'center', marginBottom: 12 }}>
                        <div
                            style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '8px',
                                background: onInkPanel ? 'rgba(255, 255, 255, 0.06)' : '#fbf6e7',
                                border: `2px solid ${onInkPanel ? 'rgba(255, 255, 255, 0.25)' : '#141414'}`,
                            }}
                        >
                            <span
                                style={{
                                    color: '#FFD23F',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                }}
                            >
                                Tahun Anggaran {fiscalYear}
                            </span>
                        </div>
                    </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Button
                        type="text"
                        icon={<InfoCircleOutlined />}
                        onClick={() => window.open('https://simasetwiki.vercel.app/', '_blank')}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            display: 'flex',
                            justifyContent: !isDrawer && collapsed ? 'center' : 'flex-start',
                            alignItems: 'center',
                            padding: !isDrawer && collapsed ? '0' : '4px 15px',
                        }}
                    >
                        {(!collapsed || isDrawer) && <span>Help</span>}
                    </Button>
                    <Button
                        type="text"
                        danger
                        icon={<LogoutOutlined />}
                        onClick={logout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            justifyContent: !isDrawer && collapsed ? 'center' : 'flex-start',
                            alignItems: 'center',
                            padding: !isDrawer && collapsed ? '0' : '4px 15px',
                        }}
                    >
                        {(!collapsed || isDrawer) && <span>Logout</span>}
                    </Button>
                </div>
            </div>
        );
    };

    const userMenu = [
        {
            key: 'user-info',
            label: (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <Avatar size={48} style={{ backgroundColor: '#FFD23F', color: '#141414', marginBottom: 8 }} icon={<UserOutlined />}>
                        {user?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <div>
                        <Text strong style={{ fontSize: '16px', display: 'block' }}>{user?.username}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{user?.role || 'User'}</Text>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <ConfigProvider
            theme={{
                token: {
                    colorPrimary: '#141414',
                    colorSuccess: '#15803d',
                    colorWarning: '#b45309',
                    colorError: '#D61F1F',
                    colorInfo: '#141414',
                    colorBgLayout: '#f6f1e4',
                    colorBgContainer: '#ffffff',
                    colorText: '#141414',
                    colorTextSecondary: '#4a4a44',
                    colorBorder: '#141414',
                    colorBorderSecondary: '#e4ddc9',
                    borderRadius: 10,
                    fontSize: 14,
                    fontFamily: '"Space Grotesk", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
                },
                components: {
                    Layout: {
                        headerBg: '#ffffff',
                        siderBg: '#141414',
                        bodyBg: '#f6f1e4',
                    },
                },
            }}
        >
            <AntApp>
                <Layout style={{ minHeight: '100vh' }}>
                    {!isMobile && (
                        <Sider
                            collapsible
                            collapsed={collapsed}
                            onCollapse={setCollapsed}
                            trigger={null}
                            theme="dark"
                            width={260}
                            collapsedWidth={88}
                        >
                            <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                {!collapsed && (
                                    <div>
                                        <div style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                            <Typewriter text="SI GEPENG" />
                                        </div>
                                        <div style={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: 12 }}>Warehouse Hub</div>
                                    </div>
                                )}
                                <Tooltip title={collapsed ? 'Buka menu' : 'Sembunyikan menu'}>
                                    <Button
                                        type="text"
                                        onClick={() => setCollapsed(!collapsed)}
                                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                        style={{ color: '#fff' }}
                                    />
                                </Tooltip>
                            </div>
                            <Menu
                                theme="dark"
                                mode="inline"
                                selectedKeys={[currentMenu]}
                                items={menuItems}
                                onClick={handleMenuClick}
                            />
                            {renderSidebarFooter()}
                        </Sider>
                    )}

                    <Layout>
                        <Header
                            className="dashboard-header"
                            style={{ padding: isMobile ? '0 12px' : '0 24px' }}
                        >
                            <Row style={{ width: '100%' }} align="middle">
                                <Col flex="none" style={{ marginRight: 12 }}>
                                    {isMobile && (
                                        <Button
                                            type="text"
                                            onClick={() => setOpenNav(!openNav)}
                                            icon={openNav ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                                            style={{ color: '#141414', fontSize: 18 }}
                                        />
                                    )}
                                </Col>
                                <Col flex="none" style={{ marginRight: 12 }}>
                                    <Dropdown menu={{ items: userMenu }} trigger={['click']}>
                                        <div className="header-user-trigger" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                            <Avatar size="small" style={{ backgroundColor: '#FFD23F', color: '#141414', marginRight: 8 }} icon={<UserOutlined />}>
                                                {user?.username?.[0]?.toUpperCase()}
                                            </Avatar>
                                            {!isMobile && <span style={{ color: '#141414' }}>{user?.username}</span>}
                                        </div>
                                    </Dropdown>
                                </Col>
                                <Col flex="auto" />
                                <Col flex="none" style={{ marginRight: 16, display: 'flex', alignItems: 'center' }}>
                                    <NotificationBell />
                                </Col>
                            </Row>
                        </Header>

                        {isMobile && (
                            <Drawer
                                title={
                                    <div style={{ fontWeight: 800, letterSpacing: '0.03em' }}>
                                        SI GEPENG <span style={{ opacity: 0.55, fontWeight: 500 }}>· Navigasi</span>
                                    </div>
                                }
                                placement="left"
                                open={openNav}
                                onClose={() => setOpenNav(false)}
                                styles={{ body: { padding: 0 }, footer: { borderTop: 'none', padding: '16px' } }}
                                footer={renderSidebarFooter(true)}
                            >
                                <Menu
                                    mode="inline"
                                    theme="light"
                                    selectedKeys={[currentMenu]}
                                    items={menuItems}
                                    onClick={handleMenuClick}
                                />
                            </Drawer>
                        )}

                        <Content style={{ padding: isMobile ? 12 : 20 }}>
                            <div
                                className="nb-panel"
                                style={{
                                    padding: isMobile ? 12 : 20,
                                    boxShadow: '6px 6px 0 #141414',
                                    minHeight: 'calc(100vh - 150px)',
                                }}
                            >
                                {currentMenu === 'step1' && <TempPersediaanStep1Table />}
                                {currentMenu === 'request-barang' && <RequestBarang />}
                            </div>
                        </Content>

                        <Footer style={{ textAlign: 'center', backgroundColor: 'transparent', padding: 15, color: '#4a4a44' }}>
                            <span style={{ fontSize: 14 }}>
                                <b>SI GEPENG WEB</b> ©2024 Developed By <b>Quantum Aset</b> | Databases By <b>SeML</b> | <a href="https://github.com/forceware680/cek-penerimaan/commits/master/">Changelog</a>
                            </span>
                        </Footer>
                    </Layout>
                </Layout>
            </AntApp>
        </ConfigProvider>
    );
}
