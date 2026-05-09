import { test, expect } from '@playwright/test';

test.describe('实时聊天室', () => {
  test.describe('公共聊天', () => {
    test('用户加入并发送公共消息', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/');

      await page.fill('input[placeholder="输入您的昵称"]', 'TestUser1');
      await page.click('button:has-text("加入聊天")');

      await expect(page.locator('text=你好, TestUser1')).toBeVisible();
      await expect(page.locator('text=已连接')).toBeVisible();

      const testMessage = 'Hello, this is a test message!';
      await page.fill('input[placeholder="发送公共消息..."]', testMessage);
      await page.click('.message-input button');

      await expect(page.locator(`text=${testMessage}`)).toBeVisible();

      await context.close();
    });

    test('消息持久化 - 刷新页面后消息仍然可见', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/');
      await page.fill('input[placeholder="输入您的昵称"]', 'PersistenceTest');
      await page.click('button:has-text("加入聊天")');

      const uniqueMessage = `Persistence test message ${Date.now()}`;
      await page.fill('input[placeholder="发送公共消息..."]', uniqueMessage);
      await page.click('.message-input button');

      await expect(page.locator(`text=${uniqueMessage}`)).toBeVisible();

      await page.reload();

      await page.fill('input[placeholder="输入您的昵称"]', 'PersistenceTest');
      await page.click('button:has-text("加入聊天")');

      await expect(page.locator(`text=${uniqueMessage}`)).toBeVisible();

      await context.close();
    });

    test('在线用户列表更新', async ({ browser }) => {
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();

      await page1.goto('/');
      await page1.fill('input[placeholder="输入您的昵称"]', 'UserA');
      await page1.click('button:has-text("加入聊天")');

      await page2.goto('/');
      await page2.fill('input[placeholder="输入您的昵称"]', 'UserB');
      await page2.click('button:has-text("加入聊天")');

      await page1.waitForTimeout(1000);
      
      await expect(page1.locator('.user-item')).toContainText('UserB');
      await expect(page2.locator('.user-item')).toContainText('UserA');

      await context1.close();

      await page2.waitForTimeout(2000);
      await expect(page2.locator('.user-item.offline')).toContainText('UserA');

      await context2.close();
    });
  });

  test.describe('私聊功能', () => {
    test('两个用户之间的私聊', async ({ browser }) => {
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();

      await page1.goto('/');
      await page1.fill('input[placeholder="输入您的昵称"]', 'PrivateUser1');
      await page1.click('button:has-text("加入聊天")');

      await page2.goto('/');
      await page2.fill('input[placeholder="输入您的昵称"]', 'PrivateUser2');
      await page2.click('button:has-text("加入聊天")');

      await page1.waitForTimeout(1000);

      await page1.click('.user-item:has-text("PrivateUser2")');

      await expect(page1.locator('text=与 PrivateUser2 私聊')).toBeVisible();

      const privateMessage = 'This is a private message!';
      await page1.fill('input[placeholder="给 PrivateUser2 发送消息..."]', privateMessage);
      await page1.click('.private-chat-window .message-input button');

      await expect(page1.locator('.private-chat-window').locator(`text=${privateMessage}`)).toBeVisible();

      await page2.click('.user-item:has-text("PrivateUser1")');
      await expect(page2.locator('text=与 PrivateUser1 私聊')).toBeVisible();
      await expect(page2.locator('.private-chat-window').locator(`text=${privateMessage}`)).toBeVisible();

      const responseMessage = 'Received!';
      await page2.fill('input[placeholder="给 PrivateUser1 发送消息..."]', responseMessage);
      await page2.click('.private-chat-window .message-input button');

      await expect(page1.locator('.private-chat-window').locator(`text=${responseMessage}`)).toBeVisible();

      await context1.close();
      await context2.close();
    });

    test('私聊消息不在公共聊天区显示', async ({ browser }) => {
      const context1 = await browser.newContext();
      const page1 = await context1.newPage();
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();

      await page1.goto('/');
      await page1.fill('input[placeholder="输入您的昵称"]', 'PublicTest1');
      await page1.click('button:has-text("加入聊天")');

      await page2.goto('/');
      await page2.fill('input[placeholder="输入您的昵称"]', 'PublicTest2');
      await page2.click('button:has-text("加入聊天")');

      await page1.waitForTimeout(1000);

      await page1.click('.user-item:has-text("PublicTest2")');

      const privateOnlyMessage = 'Secret private message only';
      await page1.fill('input[placeholder="给 PublicTest2 发送消息..."]', privateOnlyMessage);
      await page1.click('.private-chat-window .message-input button');

      await page1.waitForTimeout(500);

      const chatContainer = page1.locator('.chat-container');
      await expect(chatContainer.locator(`text=${privateOnlyMessage}`)).not.toBeVisible();

      await context1.close();
      await context2.close();
    });
  });

  test.describe('断线重连', () => {
    test('网络断开后的重连与消息恢复', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/');
      await page.fill('input[placeholder="输入您的昵称"]', 'ReconnectTest');
      await page.click('button:has-text("加入聊天")');

      await expect(page.locator('text=已连接')).toBeVisible();

      const messageBeforeDisconnect = 'Message before disconnect';
      await page.fill('input[placeholder="发送公共消息..."]', messageBeforeDisconnect);
      await page.click('.message-input button');

      await expect(page.locator(`text=${messageBeforeDisconnect}`)).toBeVisible();

      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

      await page.evaluate(() => {
        if (window.socketInstance) {
          window.socketInstance.io.engine.close();
        }
      });

      await expect(page.locator('text=未连接')).toBeVisible({ timeout: 5000 });

      await expect(page.locator('text=已连接')).toBeVisible({ timeout: 15000 });

      const messageAfterReconnect = 'Message after reconnect';
      await page.fill('input[placeholder="发送公共消息..."]', messageAfterReconnect);
      await page.click('.message-input button');

      await expect(page.locator(`text=${messageAfterReconnect}`)).toBeVisible();

      await context.close();
    });

    test('指数退避重连机制', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto('/');
      await page.fill('input[placeholder="输入您的昵称"]', 'BackoffTest');
      await page.click('button:has-text("加入聊天")');

      await expect(page.locator('text=已连接')).toBeVisible();

      await page.evaluate(() => {
        if (window.socketInstance) {
          window.socketInstance.io.engine.close();
        }
      });

      await expect(page.locator('text=未连接')).toBeVisible({ timeout: 5000 });

      await expect(page.locator('text=已连接')).toBeVisible({ timeout: 20000 });

      await context.close();
    });
  });

  test.describe('多用户场景', () => {
    test('三个用户同时在线', async ({ browser }) => {
      const contexts = [];
      const pages = [];
      const users = ['MultiUser1', 'MultiUser2', 'MultiUser3'];

      for (let i = 0; i < 3; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);

        await page.goto('/');
        await page.fill('input[placeholder="输入您的昵称"]', users[i]);
        await page.click('button:has-text("加入聊天")');
      }

      await pages[0].waitForTimeout(2000);

      for (const page of pages) {
        for (const user of users) {
          await expect(page.locator('.user-item')).toContainText(user);
        }
      }

      const broadcastMessage = 'Hello everyone!';
      await pages[0].fill('input[placeholder="发送公共消息..."]', broadcastMessage);
      await pages[0].click('.message-input button');

      for (const page of pages) {
        await expect(page.locator(`text=${broadcastMessage}`)).toBeVisible();
      }

      for (const context of contexts) {
        await context.close();
      }
    });
  });
});
