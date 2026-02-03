'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Select, Space } from 'antd';
import { UserOutlined, LockOutlined, CalendarOutlined, LoginOutlined } from '@ant-design/icons';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;

export default function Login() {
    const { setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    // Typing animation state
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
        setMounted(true);
        const phrases = ['SIGEPENG', 'Si Generator Pengeluaran'];
        const i = loopNum % phrases.length;
        const fullText = phrases[i];

        const handleTyping = () => {
            setText(isDeleting
                ? fullText.substring(0, text.length - 1)
                : fullText.substring(0, text.length + 1)
            );

            setTypingSpeed(isDeleting ? 50 : 150);

            if (!isDeleting && text === fullText) {
                setTimeout(() => setIsDeleting(true), 2000);
            } else if (isDeleting && text === '') {
                setIsDeleting(false);
                setLoopNum(loopNum + 1);
                setTypingSpeed(500);
            }
        };

        const timer = setTimeout(handleTyping, typingSpeed);
        return () => clearTimeout(timer);
    }, [text, isDeleting, loopNum, typingSpeed]);

    const onFinish = async (values: { username: string; password: string; fiscalYear: number }) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username: values.username, password: values.password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login gagal');
            }

            // Save selected fiscal year
            localStorage.setItem('fiscalYear', String(values.fiscalYear));
            setUser(data.user);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Login gagal');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="login-particles"></div>
                <div className="login-gradient-orb orb-1"></div>
                <div className="login-gradient-orb orb-2"></div>
                <div className="login-gradient-orb orb-3"></div>
            </div>
            <div className="login-overlay"></div>
            
            <div className="login-float-container">
                <Card className="login-card">
                    <div className="login-header">
                        <div className="login-logo">
                            <div className="logo-circle">
                                <span className="logo-icon">🏛️</span>
                            </div>
                        </div>
                        <Title level={2} className="login-title">
                            <span className="typing-text">{text}</span>
                            <span className="cursor">|</span>
                        </Title>
                        <Text className="login-subtitle">Sistem Informasi Cek Penerimaan</Text>
                        <div className="login-divider"></div>
                    </div>

                    {error && (
                        <Alert 
                            className="login-alert" 
                            type="error" 
                            message={error} 
                            showIcon 
                            style={{ marginBottom: 20 }}
                        />
                    )}

                    <Form 
                        layout="vertical" 
                        onFinish={onFinish} 
                        className="login-form"
                        size="large"
                    >
                        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
                            <Form.Item 
                                label={<span className="form-label">Username</span>} 
                                name="username" 
                                rules={[{ required: true, message: 'Username wajib diisi' }]}
                            >
                                <Input 
                                    prefix={<UserOutlined className="input-icon" />}
                                    autoComplete="username" 
                                    placeholder="Masukkan username" 
                                    className="login-input"
                                />
                            </Form.Item>

                            <Form.Item 
                                label={<span className="form-label">Password</span>} 
                                name="password" 
                                rules={[{ required: true, message: 'Password wajib diisi' }]}
                            >
                                <Input.Password 
                                    prefix={<LockOutlined className="input-icon" />}
                                    autoComplete="current-password" 
                                    placeholder="Masukkan password" 
                                    className="login-input"
                                />
                            </Form.Item>

                            <Form.Item 
                                label={<span className="form-label">Tahun Anggaran</span>} 
                                name="fiscalYear" 
                                initialValue={new Date().getFullYear()} 
                                rules={[{ required: true, message: 'Tahun Anggaran wajib dipilih' }]}
                            >
                                <Select 
                                    placeholder="📅 Pilih Tahun Anggaran" 
                                    className="login-select"
                                    size="large"
                                    optionLabelProp="label"
                                >
                                    <Select.Option 
                                        value={new Date().getFullYear()} 
                                        label={`${new Date().getFullYear()}`}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#667eea' }}>📅</span>
                                            <span>{new Date().getFullYear()} - Tahun Berjalan</span>
                                        </div>
                                    </Select.Option>
                                    <Select.Option 
                                        value={new Date().getFullYear() - 1} 
                                        label={`${new Date().getFullYear() - 1}`}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ color: '#764ba2' }}>📊</span>
                                            <span>{new Date().getFullYear() - 1} - Tahun Sebelumnya</span>
                                        </div>
                                    </Select.Option>
                                </Select>
                            </Form.Item>

                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                block 
                                loading={loading} 
                                size="large" 
                                className="login-button"
                                icon={<LoginOutlined />}
                            >
                                {loading ? 'Sedang Masuk...' : 'Masuk Sekarang'}
                            </Button>
                        </Space>
                    </Form>

                    <div className="login-footer">
                        <Text className="footer-text">
                            © 2026 SI GEPENG. All rights reserved.
                        </Text>
                    </div>
                </Card>
            </div>
        </div>
    );
}
