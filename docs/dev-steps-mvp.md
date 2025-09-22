# 开发流程（MVP）

面向落地的步骤清单：从环境准备 → 脚手架 → 房间/发牌 → WS 事件 → 语音通话 → 翻牌数量同步 → 猜测判定 → 测试与部署。

---

## 0) 规划与准备
- 技术栈：**Next.js(前端)**、**Node.js + ws/Socket.IO(后端)**、**WebRTC(语音)**。
- 资源：一组 **≥20 张人物头像**（`public/cards/<theme>/xx.png` 或对象存储）。
- Git 仓库初始化。

**DoD**：仓库与 README 就绪，20 张图片可用。

---

## 1) 脚手架
**前端**
- `pnpm create next-app`（或 npm/yarn），开启 TypeScript、Tailwind、App Router。
- 页面：`/`（昵称+房间码），`/room/[id]`（游戏页）。

**后端**
- Node + TypeScript；引入 `socket.io`（或 `ws`）。
- 内存存储：`rooms: Map<string, RoomState>`。

**DoD**：前后端可启动；WS 可连接。

---

## 2) 房间与初始化
- `POST /api/room/create` → 返回 `roomId`（或首个进入者即“房主”）。
- 服务器生成：`deck[20]`、每人 `secretCardId`；初始化：`remaining={A:20,B:20}`、`status='playing'`。
- 分别下发 `init_state`（仅包含“自己底牌”）。

**DoD**：双方看到相同 20 张卡 + 自己的底牌。

---

## 3) WebSocket 协议
实现三类过程事件 + 一次性初始化：
- `voice`
- `update_remaining`
- `guess` / `result`
- `init_state`（加入时下发）

**DoD**：事件 JSON 能收发（可先用假数据）。

---

## 4) 语音通道（优先 WebRTC）
- 前端：获取麦克风 → RTCPeerConnection → 借助 WS 做 SDP/ICE 信令。
- UI：麦克风开关或 PTT（按住说话）。
- 若暂缓 WebRTC：保留 `voice` 事件占位即可。

**DoD**：两端能互相听到声音（或至少看到 voice 事件流转）。

---

## 5) 翻牌与“剩余牌数”同步
- 本地点击翻盖 → 置灰/统计剩余数。
- 发送：`update_remaining { remaining }`；服务器记录并转发给对手。
- 顶部显示：`我方剩余 X / 对手剩余 Y`。

**DoD**：双方实时看到对手剩余数量变化。

---

## 6) 猜测与结算
- 前端在卡片上“猜这张” → `guess { cardId }`。
- 服务器判定：命中则胜；否则判负；广播 `result { winner, correctCard }`。
- 前端弹出结算并禁用交互。

**DoD**：正确即赢、错误即输，双方一致。

---

## 7) 错误处理与重连（MVP）
- 基础错误码：房间不存在/已满/已结束。
- 简易重连：断线后 `join_room` → 服务器重新发送 `init_state`（沿用旧状态）。
- `update_remaining` 幂等：只保存最新值。

**DoD**：刷新或短断线后可恢复。

---

## 8) 样式与适配
- 网格：自适应列（≥44px 点击区）。
- 底部固定区：底牌、语音按钮、猜测按钮。
- 图片懒加载与占位。

**DoD**：移动端可顺畅游玩。

---

## 9) 本地联调
- 两浏览器/无痕窗口自测全流程。
- 用例：剩余数边界、防抖（快速多次更新）、房间隔离。

**DoD**：无致命报错，流程稳定。

---

## 10) 部署
- 前端：Vercel；后端：Fly.io/Render/自托（需 WS 长连）。
- 环境变量：WS 地址、STUN/TURN、CDN 前缀（可选）。
- 后端日志：连接数/房间数/事件耗时。

**DoD**：外网两台设备可正常完成一局。
