type CartToastState = {
  id: number;
  visible: boolean;
  message: string;
};

export const useCartToast = () => {
  const toast = useState<CartToastState>("cart-toast", () => ({
    id: 0,
    visible: false,
    message: "Producto agregado al carrito."
  }));

  const open = (message = "Producto agregado al carrito.") => {
    toast.value = {
      id: toast.value.id + 1,
      visible: true,
      message
    };
  };

  const close = () => {
    toast.value = {
      ...toast.value,
      visible: false
    };
  };

  return { toast, open, close };
};
