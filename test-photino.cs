using System;
using Photino.NET;
class P { static void Main() {
  var w = new PhotinoWindow();
  var p = w.ShowSaveFile("Salvar CSV", "Downloads", new[] { new KeyValuePair<string, string>("CSV", "csv") });
} }
