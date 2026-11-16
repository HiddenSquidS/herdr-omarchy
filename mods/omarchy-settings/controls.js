import { div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";

// Pieces ---------------------------------------------------------------

export function heading(t, text) {
  return div().pt(4).pb(8).mb(2).border_b(1).border_color(t.border).text_size(11).font_semibold().text_color(t.accent).child(text.toUpperCase());
}

// One setting: what it is on the left, the control on the right.
export function row(t, title, about, control) {
  return h_flex()
    .w_full()
    .gap(14)
    .py(10)
    .items_center()
    .border_b(1)
    .border_color(t.border)
    .child(
      v_flex()
        .flex_1()
        .min_w(0)
        .gap(3)
        .child(div().text_size(13).text_color(t.foreground).child(title))
        .when(Boolean(about), (el) => el.child(div().text_size(12).line_height("17px").text_color(t.muted).child(about))),
    )
    .child(div().flex_none().child(control));
}

export function button(t, id, label, onClick) {
  return div()
    .id(id)
    .px(10)
    .h(30)
    .flex()
    .items_center()
    .justify_center()
    .rounded(0)
    .border_1()
    .border_color(t.border)
    .bg(t.chrome)
    .cursor_pointer()
    .text_size(13)
    .text_color(t.foreground)
    .hover((s) => s.bg(t.hover).border_color(t.accent))
    .on_click(onClick)
    .child(label);
}

// − value +
export function stepper(t, id, value, onMinus, onPlus) {
  const b = (k, label, f) =>
    div()
      .id(`${id}-${k}`)
      .w(28)
      .h(28)
      .flex()
      .items_center()
      .justify_center()
      .cursor_pointer()
      .text_size(15)
      .text_color(t.muted)
      .hover((s) => s.bg(t.hover).text_color(t.foreground))
      .on_click(f)
      .child(label);
  return h_flex()
    .items_center()
    .rounded(0)
    .border_1()
    .border_color(t.border)
    .bg(t.raised)
    .overflow_hidden()
    .child(b("minus", "\u2212", onMinus))
    .child(div().w(46).text_size(12.5).text_color(t.foreground).flex().justify_center().child(value))
    .child(b("plus", "+", onPlus));
}

export function toggle(t, id, on, onClick) {
  return div()
    .id(id)
    .w(36)
    .h(22)
    .border_1()
    .border_color(on ? t.accent : t.border)
    .rounded(0)
    .p(2)
    .cursor_pointer()
    .bg(on ? t.accent : t.background)
    .flex()
    .when(on, (el) => el.justify_end())
    .on_click(onClick)
    .child(div().w(16).h(16).rounded(0).bg(on ? t.accent_foreground : t.muted));
}
