# Git SSH 密钥配置指南

## 您的SSH公钥
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDVTRTGnGWFqZvbsLhLXKbDtm8ydV7EFR+2BaDwvPSASE4ihY5fNOQW0fl7asVyScQByhJeSOS2cP13WO5eYgIstYvh8pHnFHuO7aXcYTESsA1CaNnG4YgMCpI8WoP+rAnkeOInsX/dfnw/XQF87ZqVyEv11VuIPLmlzpOvXxJCG7vTkqToM5VQHWnC0TevaEhwr0fgcg4gRfWVnGJZa8k51gLNV2UMkArlGpkjziUNzisUEKg6OOfxiEzvqUr5gd7OZP5PGAz6jaK42noDtti1rWPuKO6kY1u2d4SqO+49RtPLwPa+BJG8Eou0U2GRZKODK/DI6H3/R0uSCFSeU2UEJ2BRe2h9hnXbMPwywjmJkpmoJK/v/5cV20vB31R20RSzWnIGpmQTMYReqT8ygwGxw2yfQTENMOw2bRYlSRZGy0T9UMge/dEfzXSSd/lMQe83dMebN9TNzFagzv5ThM1UQ7frXv3pYKBU8Fi5RF/KpcS3D/qwJ4EhGlPlZSXS2Js= 1041597094@qq.com
```

## 配置步骤

### 1. 复制SSH公钥
请完整复制上面的SSH公钥（包括从 `ssh-rsa` 开始到邮箱地址结束的所有内容）

### 2. 登录GitHub
- 访问 https://github.com
- 使用您的账户登录（jjshijing123-droid）

### 3. 添加SSH密钥到GitHub
1. 点击右上角的头像 → Settings
2. 在左侧菜单中找到 "SSH and GPG keys"
3. 点击 "New SSH key" 按钮
4. 在 "Title" 字段中输入一个描述性名称（如：MacBook Pro SSH Key）
5. 在 "Key" 字段中粘贴您复制的SSH公钥
6. 点击 "Add SSH key" 按钮

### 4. 验证配置
完成上述步骤后，在终端中运行：
```bash
ssh -T git@github.com
```

如果成功，您应该会看到类似这样的消息：
```
Hi jjshijing123-droid! You've successfully authenticated, but GitHub does not provide shell access.
```

### 5. 测试Git操作
现在可以正常执行Git命令了：
```bash
git fetch --prune
```

## 注意事项
- SSH密钥必须精确复制，不能有空格或换行
- 如果仍然失败，请检查SSH密钥权限：`ls -la ~/.ssh/id_rsa*`
- 确保私钥权限为600：`chmod 600 ~/.ssh/id_rsa`
- 确保公钥权限为644：`chmod 644 ~/.ssh/id_rsa.pub`