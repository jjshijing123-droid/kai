# 新SSH密钥配置指南

## 您的新的SSH公钥（复制这一整行）
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQC5WmmRutQI7ulUw0DAej8+/SvNv04kRFZn1HXGV0AAuEQGpsR32RtPsp3fjHvt3AI1+Dau88iU9jrMqQ+HxJ//pL2QoSHyk/umJcFHogG+fV5znSHaOfJx6Zhpt+9jqF8uC8rE6cW0NKN9k4y1q8dI0JLkoXfvEfqLMIWkNEzDdaYLT7/a4BVpuP1zzB1Xeff4aM1/Beu5uFhMJWeMjENVRFWYUXV2vG72hPlI2EisFBCFthkWKzbvoksrWk3LoajcqahXDTa2rulf1Fn+hAbDpacVbwSFctyiVVjQb+fUP7YfWH6Aq9ntbKNgyqZDMJp86fjv7ZrGNDqrjjFzd7OfZpWAntOKd9YqJx7rq9JWNqHYgriAI28v0VQHgz+CdCNRy4YPqiL24kdU0UtHEgSXSKFsl7CTGj2AwWHi9G43pGXAoJ8XyyNVZ4pJaSlka8rl+G6rHPaXMvlzcL0RsfPIN8yQ8cXrthWsZ+zE8C+4mwGqHU/3SqjFsDkLX/gTVXO0M01jbrRaeuj10V3GwLZLKzTSnj3OsDzQnduRUcwD8V15+fpFgCbmWmPkJp7pKXh3FuwXabhUDItESuvJlusxKYPOwLUEr+NUUULTI1Hir4+bNUoJpbhGd2fTn0LadcqpMfvUg8fAdn31Nm6/SdwjJ5SCCFu7fq16Poo4/9ulAQ== jjshijing123-droid
```

## 新密钥特性
- ✅ 无密码短语（使用更方便）
- ✅ 4096位RSA加密（安全性高）
- ✅ 已备份原密钥到 `~/.ssh/id_rsa.backup`

## 配置步骤

### 第1步：复制新SSH公钥
1. 选中上面完整的新SSH公钥
2. 按 `Cmd+C` 复制

### 第2步：访问GitHub Settings
1. 打开浏览器，访问：https://github.com
2. 登录您的账户（jjshijing123-droid）
3. 点击右上角您的头像
4. 选择 "Settings"（设置）

### 第3步：替换SSH密钥
1. 在左侧边栏中，找到 "Access" 部分
2. 点击 "SSH and GPG keys"
3. 找到您之前添加的旧SSH密钥
4. 点击 "Delete" 删除旧密钥
5. 点击 "New SSH key" 添加新密钥
6. 在 "Title" 字段中输入：`MacBook Pro SSH Key (New)`
7. 在 "Key" 字段中粘贴您复制的新SSH公钥
8. 点击 "Add SSH key" 按钮

### 第4步：验证配置
在终端中运行以下命令测试连接：
```bash
ssh -T git@github.com
```

如果成功，您应该看到：
```
Hi jjshijing123-droid! You've successfully authenticated, but GitHub does not provide shell access.
```

### 第5步：测试Git操作
现在可以正常执行Git命令，无需输入密码：
```bash
git fetch --prune
```

## 故障排除

如果仍然失败，请检查：
1. 新SSH公钥是否完整复制（不能有换行）
2. 是否删除了旧的SSH密钥
3. GitHub账户是否正确登录

## 备份信息
- 旧密钥已备份到：`~/.ssh/id_rsa.backup`
- 新密钥位置：`~/.ssh/id_rsa`