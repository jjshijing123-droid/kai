# SSH配置到GitHub - 详细操作指南

## 您的SSH公钥（复制这一整行）
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDVTRTGnGWFqZvbsLhLXKbDtm8ydV7EFR+2BaDwvPSASE4ihY5fNOQW0fl7asVyScQByhJeSOS2cP13WO5eYgIstYvh8pHnFHuO7aXcYTESsA1CaNnG4YgMCpI8WoP+rAnkeOInsX/dfnw/XQF87ZqVyEv11VuIPLmlzpOvXxJCG7vTkqToM5VQHWnC0TevaEhwr0fgcg4gRfWVnGJZa8k51gLNV2UMkArlGpkjziUNzisUEKg6OOfxiEzvqUr5gd7OZP5PGAz6jaK42noDtti1rWPuKO6kY1u2d4SqO+49RtPLwPa+BJG8Eou0U2GRZKODK/DI6H3/R0uSCFSeU2UEJ2BRe2h9hnXbMPwywjmJkpmoJK/v/5cV20vB31R20RSzWnIGpmQTMYReqT8ygwGxw2yfQTENMOw2bRYlSRZGy0T9UMge/dEfzXSSd/lMQe83dMebN9TNzFagzv5ThM1UQ7frXv3pYKBU8Fi5RF/KpcS3D/qwJ4EhGlPlZSXS2Js= 1041597094@qq.com
```

## 分步操作指南

### 第1步：复制SSH公钥
1. 选中上面完整的SSH公钥
2. 按 `Cmd+C` 复制

### 第2步：访问GitHub Settings
1. 打开浏览器，访问：https://github.com
2. 登录您的账户（jjshijing123-droid）
3. 点击右上角您的头像
4. 选择 "Settings"（设置）

### 第3步：导航到SSH设置
1. 在左侧边栏中，找到 "Access" 部分
2. 点击 "SSH and GPG keys"

### 第4步：添加SSH密钥
1. 点击页面右上角的 "New SSH key" 绿色按钮
2. 在 "Title" 字段中输入：`MacBook Pro SSH Key`（或任何您喜欢的名称）
3. 在 "Key" 字段中粘贴您复制的SSH公钥
4. 点击 "Add SSH key" 按钮

### 第5步：确认添加
- GitHub可能会要求您输入密码确认身份

### 第6步：验证配置
在终端中运行以下命令测试连接：
```bash
ssh -T git@github.com
```

如果成功，您应该看到：
```
Hi jjshijing123-droid! You've successfully authenticated, but GitHub does not provide shell access.
```

### 第7步：测试Git操作
现在可以正常执行Git命令：
```bash
git fetch --prune
```

## 故障排除

如果仍然失败，请检查：
1. SSH公钥是否完整复制（不能有换行）
2. GitHub账户是否正确登录
3. SSH密钥权限是否正确（已确认正确）

## 当前状态
- ✅ SSH密钥存在且权限正确
- ✅ 远程仓库URL已设置为SSH格式
- ⏳ 等待SSH公钥添加到GitHub