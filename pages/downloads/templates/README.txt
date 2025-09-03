目录：pages/downloads/templates/

用途：存放所有本地公文/办公模板（如 docx、pptx、xlsx、pdf、md、zip 等）。

放置说明：
1) 将模板文件直接放入本目录或子目录。
2) 在下载页面 HTML（pages/downloads/index.html）对应卡片上：
   - a 标签 href 指向相对路径，如：./templates/OfficialDocTemplate.docx
   - 容器卡片元素添加 data-file="./templates/OfficialDocTemplate.docx"，脚本会自动读取大小与格式
3) 可使用子目录进行分类，但请保证 href 与 data-file 指向正确的相对路径。

动态信息显示：
- pages/downloads/script.js 会对带有 data-file 的元素使用 HEAD 请求尝试读取 Content-Length，填充 .download-size。
- 扩展名用于填充 .download-format（如 DOCX 格式、PPTX 格式）。
- 若服务器不返回 Content-Length，将显示“大小未知”。

示例（HTML 片段）：
<div class="download-card" data-file="./templates/OfficialDocTemplate.docx">
  <div class="download-title">公文模板（示例）</div>
  <div class="download-info">
    <span class="download-size">-</span>
    <span class="download-format">-</span>
  </div>
  <a class="download-button" href="./templates/OfficialDocTemplate.docx" download>下载</a>
</div>

注意：
- 页面路径为 pages/downloads/index.html，故相对路径以 ./templates/ 开头即可。
- 压缩包（zip/7z）下载时会显示压缩包大小；如需列出包含清单，请在描述中补充。
