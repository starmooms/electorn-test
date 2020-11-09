On Error Resume Next
set ws = WScript.CreateObject("WScript.Shell")
ws.Run "cmd /c upper-computer.exe", 0
if err.number<>0 then
wscript.echo err.number & "<br>" & err.description & "<br>"  & err.source
end if

' On Error Resume Next
' set ws = WScript.CreateObject("WScript.Shell")
' ws.Run "cmd /c upper-computer.exe", 0
' If ws.Errors.Count > 0 Then 
' ' Enumerate Errors collection and display 
' ' properties of each Error object. 
' For Each errLoop In ws.Errors 
' strError = "Error #" & errLoop.Number & "<br>" & _ 
' " " & errLoop.Description & "<br>" & _ 
' " (Source: " & errLoop.Source & ")" & "<br>" & _ 
' " (SQL State: " & errLoop.SQLState & ")" & "<br>" & _ 
' " (NativeError: " & errLoop.NativeError & ")" & "<br>" 
' If errLoop.HelpFile = "" Then 
' strError = strError & _ 
' " No Help file available" & _ 
' "<br><br>" 
' Else 
' strError = strError & _ 
' " (HelpFile: " & errLoop.HelpFile & ")" & "<br>" & _ 
' " (HelpContext: " & errLoop.HelpContext & ")" & _ 
' "<br><br>" 
' End If 
' Response.Write ("<p>" & strError & "</p>") 
' Next 
' End If 

' <!-- BeginErrorExampleVBS --> 
' <HTML> 
' <HEAD> 
' <META NAME="GENERATOR" Content="Microsoft Visual Studio 6.0"> 
' <TITLE>Error Handling example (VBScript)</TITLE> 
' </HEAD> 
' <BODY> 
 
' <h1>Error Handling example (VBScript)</h1> 
 
' <% 
'  Dim errLoop 
'  Dim strError 
 
'  On Error Resume Next 
 
'  ' Intentionally trigger an error. 
'  Set cnn1 = Server.CreateObject("ADODB.Connection") 
'  cnn1.Open "nothing" 
 
'  If cnn1.Errors.Count > 0 Then 
'  ' Enumerate Errors collection and display 
'  ' properties of each Error object. 
'  For Each errLoop In cnn1.Errors 
'  strError = "Error #" & errLoop.Number & "<br>" & _ 
'  " " & errLoop.Description & "<br>" & _ 
'  " (Source: " & errLoop.Source & ")" & "<br>" & _ 
'  " (SQL State: " & errLoop.SQLState & ")" & "<br>" & _ 
'  " (NativeError: " & errLoop.NativeError & ")" & "<br>" 
'  If errLoop.HelpFile = "" Then 
'  strError = strError & _ 
'  " No Help file available" & _ 
'  "<br><br>" 
'  Else 
'  strError = strError & _ 
'  " (HelpFile: " & errLoop.HelpFile & ")" & "<br>" & _ 
'  " (HelpContext: " & errLoop.HelpContext & ")" & _ 
'  "<br><br>" 
'  End If 
'  Response.Write ("<p>" & strError & "</p>") 
'  Next 
'  End If 
' %> 
 
' </BODY> 
' </HTML> 
' <!-- EndErrorExampleVBS --> 