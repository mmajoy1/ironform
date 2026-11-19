import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',testMatch:'morning*.spec.js',workers:1,timeout:30000,use:{baseURL:'http://127.0.0.1:8767',viewport:{width:390,height:844},deviceScaleFactor:1},webServer:{command:'node tests/server.cjs',port:8767,reuseExistingServer:true}});
