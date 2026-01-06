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
    theme as antdTheme,
    Switch,
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
    SunOutlined,
    MoonOutlined,
} from '@ant-design/icons';
import TempPersediaanStep1Table from './TempPersediaanStep1Table';
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
            <span className="cursor">|</span>
        </span>
    );
};

export default function Dashboard() {
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [openNav, setOpenNav] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 992);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isMobile) setOpenNav(false);
    }, [isMobile]);

    useEffect(() => {
        const cls = 'theme-dark';
        if (isDark) document.body.classList.add(cls);
        else document.body.classList.remove(cls);
    }, [isDark]);

    const menuItems = [
        {
            key: 'step1',
            icon: <CheckOutlined />,
            label: 'Cek Saldo Penerimaan',
        },
    ];

    const handleMenuClick = () => {
        if (isMobile) setOpenNav(false);
    };

    const userMenu = [
        {
            key: 'user-info',
            label: (
                <div style={{ textAlign: 'center', padding: '8px 0' }}>
                    <Avatar size={48} style={{ backgroundColor: '#2F54EB', marginBottom: 8 }} icon={<UserOutlined />}>
                        {user?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <div>
                        <Text strong style={{ fontSize: '16px', display: 'block' }}>{user?.username}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{user?.role || 'User'}</Text>
                    </div>
                </div>
            ),
        },
        { type: 'divider' as const },
        {
            key: 'logout',
            label: 'Logout',
            icon: <LogoutOutlined />,
            onClick: logout,
            danger: true,
        },
    ];

    return (
        <ConfigProvider
            theme={{
                algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
                token: {
                    colorPrimary: '#2F54EB',
                    borderRadius: 8,
                    fontSize: 14,
                    colorBgContainer: isDark ? '#141414' : '#ffffff',
                },
            }}
        >
            <AntApp>
                <Layout style={{ minHeight: '100vh', backgroundColor: isDark ? '#0f1214' : '#f5f7fa' }}>
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
                                        <div style={{ color: '#888', fontSize: 12 }}>Warehouse Hub</div>
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
                                selectedKeys={['step1']}
                                items={menuItems}
                                onClick={handleMenuClick}
                            />
                            {!collapsed && (
                                <div style={{ position: 'absolute', bottom: 80, left: 16, right: 16, padding: 12, background: 'rgba(255,255,255,0.1)', borderRadius: 8 }}>
                                    <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>
                                        <InfoCircleOutlined /> Tips
                                    </div>
                                    <p style={{ color: '#ccc', fontSize: 11, margin: 0 }}>Makan dulu sebelum ngopi.</p>
                                </div>
                            )}
                        </Sider>
                    )}

                    <Layout>
                        <Header style={{ padding: isMobile ? '0 12px' : '0 24px', background: isDark ? '#141414' : '#fff' }}>
                            <Row style={{ width: '100%' }} align="middle">
                                <Col flex="none" style={{ marginRight: 12 }}>
                                    {isMobile && (
                                        <Button
                                            type="text"
                                            onClick={() => setOpenNav(!openNav)}
                                            icon={openNav ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
                                            style={{ color: isDark ? '#fff' : '#1f1f1f', fontSize: 18 }}
                                        />
                                    )}
                                </Col>
                                {!isMobile && (
                                    <Col flex="none" style={{ marginRight: 12 }}>
                                        <Dropdown menu={{ items: userMenu }} trigger={['click']}>
                                            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <Avatar size="small" style={{ backgroundColor: '#2F54EB', marginRight: 8 }} icon={<UserOutlined />}>
                                                    {user?.username?.[0]?.toUpperCase()}
                                                </Avatar>
                                                <span style={{ color: isDark ? '#fff' : '#1f1f1f' }}>{user?.username}</span>
                                            </div>
                                        </Dropdown>
                                    </Col>
                                )}
                                <Col flex="auto" />
                                <Col flex="none">
                                    <Tooltip title={isDark ? 'Switch to Light' : 'Switch to Dark'}>
                                        <Switch
                                            checked={isDark}
                                            onChange={setIsDark}
                                            checkedChildren={<MoonOutlined />}
                                            unCheckedChildren={<SunOutlined />}
                                        />
                                    </Tooltip>
                                </Col>
                            </Row>
                        </Header>

                        {isMobile && (
                            <Drawer
                                title="Navigasi"
                                placement="left"
                                open={openNav}
                                onClose={() => setOpenNav(false)}
                                styles={{ body: { padding: 0 } }}
                            >
                                <Menu
                                    mode="inline"
                                    selectedKeys={['step1']}
                                    items={menuItems}
                                    onClick={handleMenuClick}
                                />
                            </Drawer>
                        )}

                        <Content style={{ padding: isMobile ? 12 : 20 }}>
                            <div
                                style={{
                                    backgroundColor: isDark ? '#141414' : '#fff',
                                    borderRadius: 10,
                                    padding: isMobile ? 12 : 20,
                                    boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.35)' : '0 2px 8px rgba(0,0,0,0.06)',
                                    minHeight: 'calc(100vh - 150px)',
                                }}
                            >
                                <TempPersediaanStep1Table />
                            </div>
                        </Content>

                        <Footer style={{ textAlign: 'center', backgroundColor: 'transparent', padding: 15, color: isDark ? '#9ca3af' : undefined }}>
                            <span style={{ fontSize: 14 }}>
                                <b>SI GEPENG WEB</b> ©2024 Developed By <b>Herman Prasetyo</b> | Databases By <b>SeML</b>
                            </span>
                        </Footer>
                    </Layout>
                </Layout>
            </AntApp>
        </ConfigProvider>
    );
}
