$baseUrl = "http://127.0.0.1:4848"

$interpretBody = @{
  message = "继续"
  scenario = "general"
} | ConvertTo-Json -Compress

$interpret = Invoke-RestMethod `
  -Method Post `
  -Uri "$baseUrl/interpret" `
  -ContentType "application/json" `
  -Body $interpretBody

$interpret.result.normalized_intent

$manageBody = @{
  request = "添加用户习惯短句: phrase=收尾一下; intent=close_session; 场景=session_close; 置信度=0.86"
} | ConvertTo-Json -Compress

$manage = Invoke-RestMethod `
  -Method Post `
  -Uri "$baseUrl/manage" `
  -ContentType "application/json" `
  -Body $manageBody

$manage.result.action

