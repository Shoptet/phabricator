<?php

final class PHUICurtainPanelTogglView {

  private $spent;

  public function setEfforts($spent)
  {
    $this->spent = $spent;
    return $this;
  }

  public function getHeaderText() {
    return sprintf("Toggl: %s", $this->spent['total']);
  }

  protected function getUsersView() {
    $view = new PHUIStatusListView();
    foreach ($this->spent['users'] as $name => $duration) {
      $view->addItem(
        id(new PHUIStatusItemView())
          ->setIcon(PHUIStatusItemView::ICON_CLOCK, 'indigo')
          ->setTarget($name)
          ->setNote($duration));
    }
    return $view;
  }

  public function getPanel()
  {
    $panel = new PHUICurtainPanelView();
    $panel->setHeaderText($this->getHeaderText());
    $panel->appendChild($this->getUsersView());
    return $panel;
  }
}
