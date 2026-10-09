using System;
using System.Collections.Generic;
using Photino.NET;
class P { static void Main() {
  var w = new PhotinoWindow();
  string[] p = w.ShowSaveFile("T", "D", new[] { new KeyValuePair<string, string>("C", "c") });
} }
