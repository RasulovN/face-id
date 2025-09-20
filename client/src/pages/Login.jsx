import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message,  Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import API_BASE_URL from '../config';

const { Title, Text } = Typography;

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? values : { email: values.email, password: values.password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('companyId', data.companyId);
        localStorage.setItem('companyName', data.name);
        message.success(`${isRegister ? 'Registration' : 'Login'} successful!`);
        navigate('/dashboard');
      } else {
        message.error(data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card
        className="w-full max-w-md shadow-2xl border-0"
        bodyStyle={{ padding: '2rem' }}
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserOutlined className="text-white text-2xl" />
          </div>
          <Title level={2} className="mb-2">
            {isRegister ? 'Create Company Account' : 'Welcome Back'}
          </Title>
          <Text type="secondary">
            {isRegister ? 'Register your company to get started' : 'Sign in to your company dashboard'}
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          {isRegister && (
            <Form.Item
              name="name"
              label="Company Name"
              rules={[{ required: true, message: 'Please enter your company name' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter company name"
              />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Enter email address"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className="h-12 bg-blue-600 hover:bg-blue-700"
            >
              {isRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </Form.Item>
        </Form>

        <Divider>
          <Text type="secondary">or</Text>
        </Divider>

        <div className="text-center">
          <Text type="secondary">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
          </Text>
          <Button
            type="link"
            onClick={() => {
              setIsRegister(!isRegister);
              form.resetFields();
            }}
            className="ml-2 p-0 h-auto font-semibold"
          >
            {isRegister ? 'Sign In' : 'Create Account'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
