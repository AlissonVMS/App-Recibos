using System;
using Avalonia.Controls;
using AppRecibos.Native.ViewModels;

namespace AppRecibos.Native.Views;

public partial class PaymentDialog : Window
{
    public PaymentDialog()
    {
        InitializeComponent();
    }

    public PaymentDialog(PaymentDialogViewModel vm) : this()
    {
        DataContext = vm;
        vm.RequestClose += () => Close(vm.IsConfirmed);
    }
}
