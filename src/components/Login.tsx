'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Select } from 'antd';
import { useAuth } from '@/context/AuthContext';

const { Title, Text } = Typography;

export default function Login() {
    const { setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Typing animation state
    const [text, setText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [loopNum, setLoopNum] = useState(0);
    const [typingSpeed, setTypingSpeed] = useState(150);

    useEffect(() => {
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

    return (
        <div className="login-container">
            <div className="login-background"></div>
            <div className="login-overlay"></div>
            <Card className="login-card">
                <div className="login-header">
                    <Title level={2} className="login-title">
                        <span className="typing-text">{text}</span>
                        <span className="cursor">|</span>
                    </Title>
                    <Text className="login-subtitle">Sistem Informasi Cek Penerimaan</Text>
                </div>

                {error && <Alert className="login-alert" type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

                <Form layout="vertical" onFinish={onFinish} className="login-form">
                    <Form.Item label="Username" name="username" rules={[{ required: true, message: 'Username wajib' }]}>
                        <Input autoFocus autoComplete="username" placeholder="Masukkan username" size="large" />
                    </Form.Item>
                    <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Password wajib' }]}>
                        <Input.Password autoComplete="current-password" placeholder="Masukkan password" size="large" />
                    </Form.Item>

                    <Form.Item label="Tahun Anggaran" name="fiscalYear" initialValue={new Date().getFullYear()} rules={[{ required: true, message: 'Tahun Anggaran wajib dipilih' }]}>
                        <Select placeholder="Pilih Tahun Anggaran" size="large">
                            <Select.Option value={new Date().getFullYear()}>{new Date().getFullYear()}</Select.Option>
                            <Select.Option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</Select.Option>
                        </Select>
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block loading={loading} size="large" className="login-button">
                        Masuk Sekarang
                    </Button>
                </Form>
            </Card>
        </div>
    );
}
