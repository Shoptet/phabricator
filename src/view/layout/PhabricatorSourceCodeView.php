<?php

final class PhabricatorSourceCodeView extends AphrontView {

  private $lines;
  private $uri;
  private $highlights = array();
  private $canClickHighlight = true;
  private $truncatedFirstBytes = false;
  private $truncatedFirstLines = false;
  private $symbolMetadata;
  private $blameMap;

  public function setLines(array $lines) {
    $this->lines = $lines;
    return $this;
  }

  public function setURI(PhutilURI $uri) {
    $this->uri = $uri;
    return $this;
  }

  public function setHighlights(array $array) {
    $this->highlights = array_fuse($array);
    return $this;
  }

  public function disableHighlightOnClick() {
    $this->canClickHighlight = false;
    return $this;
  }

  public function setTruncatedFirstBytes($truncated_first_bytes) {
    $this->truncatedFirstBytes = $truncated_first_bytes;
    return $this;
  }

  public function setTruncatedFirstLines($truncated_first_lines) {
    $this->truncatedFirstLines = $truncated_first_lines;
    return $this;
  }

  public function setSymbolMetadata(array $symbol_metadata) {
    $this->symbolMetadata = $symbol_metadata;
    return $this;
  }

  public function getSymbolMetadata() {
    return $this->symbolMetadata;
  }

  public function setBlameMap(array $map) {
    $this->blameMap = $map;
    return $this;
  }

  public function getBlameMap() {
    return $this->blameMap;
  }

  public function render() {
    $blame_map = $this->getBlameMap();
    $has_blame = ($blame_map !== null);

    require_celerity_resource('phabricator-source-code-view-css');
    require_celerity_resource('syntax-highlighting-css');

    Javelin::initBehavior('phabricator-oncopy', array());
    if ($this->canClickHighlight) {
      Javelin::initBehavior('phabricator-line-linker');
    }

    $line_number = 1;

    $rows = array();

    $lines = $this->lines;
    if ($this->truncatedFirstLines) {
      $lines[] = phutil_tag(
          'span',
          array(
            'class' => 'c',
          ),
          pht('...'));
    } else if ($this->truncatedFirstBytes) {
      $last_key = last_key($lines);
      $lines[$last_key] = hsprintf(
        '%s%s',
        $lines[$last_key],
        phutil_tag(
          'span',
          array(
            'class' => 'c',
          ),
          pht('...')));
    }

    $base_uri = (string)$this->uri;
    foreach ($lines as $line) {
      // NOTE: See phabricator-oncopy behavior.
      $content_line = hsprintf("\xE2\x80\x8B%s", $line);

      $row_attributes = array();
      if (isset($this->highlights[$line_number])) {
        $row_attributes['class'] = 'phabricator-source-highlight';
      }

      if ($this->canClickHighlight) {
        if ($base_uri) {
          $line_href = $base_uri.'$'.$line_number;
        } else {
          $line_href = null;
        }

        $tag_number = phutil_tag(
          'a',
          array(
            'href' => $line_href,
          ),
          $line_number);
      } else {
        $tag_number = phutil_tag(
          'span',
          array(),
          $line_number);
      }

      if ($has_blame) {
        $lines = idx($blame_map, $line_number);

        if ($lines) {
          $skip_blame = 'skip;'.$lines;
          $info_blame = 'info;'.$lines;
        } else {
          $skip_blame = null;
          $info_blame = null;
        }

        $blame_cells = array(
          phutil_tag(
            'th',
            array(
              'class' => 'phabricator-source-blame-skip',
              'data-blame' => $skip_blame,
            )),
          phutil_tag(
            'th',
            array(
              'class' => 'phabricator-source-blame-info',
              'data-blame' => $info_blame,
            )),
        );
      } else {
        $blame_cells = null;
      }

      $rows[] = phutil_tag(
        'tr',
        $row_attributes,
        array(
          $blame_cells,
          phutil_tag(
            'th',
            array(
              'class' => 'phabricator-source-line',
            ),
            $tag_number),
          phutil_tag(
            'td',
            array(
              'class' => 'phabricator-source-code',
            ),
            $content_line),
          ));

      $line_number++;
    }

    $classes = array();
    $classes[] = 'phabricator-source-code-view';
    $classes[] = 'remarkup-code';
    $classes[] = 'PhabricatorMonospaced';

    $symbol_metadata = $this->getSymbolMetadata();

    $sigils = array();
    $sigils[] = 'phabricator-source';
    $sigils[] = 'has-symbols';

    Javelin::initBehavior('repository-crossreference');

    return phutil_tag_div(
      'phabricator-source-code-container',
      javelin_tag(
        'table',
        array(
          'class' => implode(' ', $classes),
          'sigil' => implode(' ', $sigils),
          'meta' => array(
            'uri' => (string)$this->uri,
            'symbols' => $symbol_metadata,
          ),
        ),
        phutil_implode_html('', $rows)));
  }

}
