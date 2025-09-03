目录：pages/downloads/fonts/

用途：存放所有本地字体文件（如 TTF/OTF/TTF 集合压缩包等）。

放置说明：
1) 将字体文件直接放入本目录。
2) 在下载页面 HTML（pages/downloads/index.html）对应卡片上：
   - a 标签 href 指向相对路径，如：./fonts/YourFont.ttf
   - 容器卡片元素添加 data-file="./fonts/YourFont.ttf"，用于脚本读取大小与格式
3) 支持的常见扩展名：ttf、otf、ttc、zip、7z。

动态信息显示：
- pages/downloads/script.js 会对带有 data-file 的元素尝试发送 HEAD 请求读取 Content-Length，并据此更新 .download-size 文本；格式来自扩展名并更新 .download-format。
- 若服务器不返回 Content-Length，将显示“大小未知”。

示例（HTML 片段）：
<div class="download-card" data-file="./fonts/YourFont.ttf">
  <div class="download-title">Your Font 名称</div>
  <div class="download-info">
    <span class="download-size">-</span>
    <span class="download-format">-</span>
  </div>
  <a class="download-button" href="./fonts/YourFont.ttf" download>下载</a>
</div>

注意：
- 页面路径为 pages/downloads/index.html，故相对路径以 ./fonts/ 开头即可。
- 若放置的是压缩包，可在标题或描述中说明包含的字体内容。
