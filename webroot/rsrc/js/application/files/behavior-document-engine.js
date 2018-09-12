/**
 * @provides javelin-behavior-document-engine
 * @requires javelin-behavior
 *           javelin-dom
 *           javelin-stratcom
 */

JX.behavior('document-engine', function(config, statics) {

  function onmenu(e) {
    var node = e.getNode('document-engine-view-dropdown');
    var data = JX.Stratcom.getData(node);

    if (data.menu) {
      return;
    }

    e.prevent();

    var menu = new JX.PHUIXDropdownMenu(node);
    var list = new JX.PHUIXActionListView();

    var view;
    var engines = [];
    for (var ii = 0; ii < data.views.length; ii++) {
      var spec = data.views[ii];

      view = new JX.PHUIXActionView()
        .setName(spec.name)
        .setIcon(spec.icon)
        .setIconColor(spec.color)
        .setHref(spec.engineURI);

      view.setHandler(JX.bind(null, function(spec, e) {
        if (!e.isNormalClick()) {
          return;
        }

        e.prevent();
        menu.close();

        onview(data, spec, false);
      }, spec));

      list.addItem(view);

      engines.push({
        spec: spec,
        view: view
      });
    }

    list.addItem(
      new JX.PHUIXActionView()
        .setDivider(true));

    var encode_item = new JX.PHUIXActionView()
      .setName(data.encode.name)
      .setIcon(data.encode.icon);

    var onencode = JX.bind(null, function(data, e) {
      e.prevent();

      if (encode_item.getDisabled()) {
        return;
      }

      new JX.Workflow(data.encode.uri, {encoding: data.encode.value})
        .setHandler(function(r) {
          data.encode.value = r.encoding;
          onview(data);
        })
        .start();

      menu.close();

    }, data);

    encode_item.setHandler(onencode);

    list.addItem(encode_item);

    var highlight_item = new JX.PHUIXActionView()
      .setName(data.highlight.name)
      .setIcon(data.highlight.icon);

    var onhighlight = JX.bind(null, function(data, e) {
      e.prevent();

      if (highlight_item.getDisabled()) {
        return;
      }

      new JX.Workflow(data.highlight.uri, {highlight: data.highlight.value})
        .setHandler(function(r) {
          data.highlight.value = r.highlight;
          onview(data);
        })
        .start();

      menu.close();
    }, data);

    highlight_item.setHandler(onhighlight);

    list.addItem(highlight_item);

    menu.setContent(list.getNode());

    menu.listen('open', function() {
      for (var ii = 0; ii < engines.length; ii++) {
        var engine = engines[ii];

        // Highlight the current rendering engine.
        var is_selected = (engine.spec.viewKey == data.viewKey);
        engine.view.setSelected(is_selected);

        if (is_selected) {
          encode_item.setDisabled(!engine.spec.canEncode);
          highlight_item.setDisabled(!engine.spec.canHighlight);
        }
      }
    });

    data.menu = menu;
    menu.open();
  }

  function add_params(uri, data) {
    uri = JX.$U(uri);

    if (data.highlight.value) {
      uri.setQueryParam('highlight', data.highlight.value);
    }

    if (data.encode.value) {
      uri.setQueryParam('encode', data.encode.value);
    }

    return uri.toString();
  }

  function onview(data, spec, immediate) {
    if (!spec) {
      for (var ii = 0; ii < data.views.length; ii++) {
        if (data.views[ii].viewKey == data.viewKey) {
          spec = data.views[ii];
          break;
        }
      }
    }

    data.sequence = (data.sequence || 0) + 1;
    var handler = JX.bind(null, onrender, data, data.sequence, spec);

    data.viewKey = spec.viewKey;

    var uri = add_params(spec.engineURI, data);

    new JX.Request(uri, handler)
      .send();

    if (data.loadingView) {
      // If we're already showing "Loading...", immediately change it to
      // show the new document type.
      onloading(data, spec);
    } else if (!immediate) {
      // Otherwise, grey out the document and show "Loading..." after a
      // short delay. This prevents the content from flickering when rendering
      // is fast.
      var viewport = JX.$(data.viewportID);
      JX.DOM.alterClass(viewport, 'document-engine-in-flight', true);

      var load = JX.bind(null, onloading, data, spec);
      data.loadTimer = setTimeout(load, 333);

      // Replace the URI with the URI for the specific rendering the user
      // has selected.

      var view_uri = add_params(spec.viewURI, data);
      JX.History.replace(view_uri);
    }
  }

  function onloading(data, spec) {
    data.loadingView = true;

    var viewport = JX.$(data.viewportID);
    JX.DOM.alterClass(viewport, 'document-engine-in-flight', false);
    JX.DOM.setContent(viewport, JX.$H(spec.loadingMarkup));
  }

  function onrender(data, sequence, spec, r) {
    // If this isn't the most recent request we sent, throw it away. This can
    // happen if the user makes multiple selections from the menu while we are
    // still rendering the first view.
    if (sequence != data.sequence) {
      return;
    }

    if (data.loadTimer) {
      clearTimeout(data.loadTimer);
      data.loadTimer = null;
    }

    var viewport = JX.$(data.viewportID);

    JX.DOM.alterClass(viewport, 'document-engine-in-flight', false);
    data.loadingView = false;

    JX.DOM.setContent(viewport, JX.$H(r.markup));

    // If this engine supports rendering blame, populate or draw it.
    if (spec.canBlame) {
      blame(data);
    }
  }

  function blame(data) {
    // If the rendering engine can't handle blame, bail.
    if (!data.blame.uri) {
      return;
    }

    // If we already have an outstanding request for blame data, bail.
    if (data.blame.request) {
      return;
    }

    // If we don't have blame data yet, request it and then try rendering
    // again later.
    if (!data.blame.value) {
      var req = new JX.Request(data.blame.uri, JX.bind(null, onblame, data));
      data.blame.request = req;
      req.send();
      return;
    }

    // We're ready to render.
    var viewport = JX.$(data.viewportID);

    var row_nodes = JX.DOM.scry(viewport, 'tr');
    var row_list = [];
    var ii;

    for (ii = 0; ii < row_nodes.length; ii++) {
      var row = {};
      var keep = false;
      var node = row_nodes[ii];

      for (var jj = 0; jj < node.childNodes.length; jj++) {
        var child = node.childNodes[jj];

        if (!JX.DOM.isType(child, 'th')) {
          continue;
        }

        var spec = child.getAttribute('data-blame');
        if (spec) {
          row[spec] = child;
          keep = true;
        }

        if (spec === 'info') {
          row.lines = child.getAttribute('data-blame-lines');
        }
      }

      if (keep) {
        row_list.push(row);
      }
    }

    var last = null;
    for (ii = 0; ii < row_list.length; ii++) {
      var commit = data.blame.value.blame[row_list[ii].lines - 1];
      row_list[ii].commit = commit;
      row_list[ii].last = last;
      last = commit;
    }

    for (ii = 0; ii < row_list.length; ii++) {
      renderBlame(row_list[ii], data.blame.value);
    }
  }

  function onblame(data, r) {
    data.blame.request = null;
    data.blame.value = r;
    blame(data);
  }

  function renderBlame(row, blame) {
    var spec = blame.map[row.commit];


    var info = null;
    var skip = null;

    if (spec && (row.commit != row.last)) {
      skip = JX.$H(spec.skip);
      info = JX.$H(spec.info);
    }

    if (row.skip) {
      JX.DOM.setContent(row.skip, skip);
    }

    if (row.info) {
      JX.DOM.setContent(row.info, info);
    }
  }

  if (!statics.initialized) {
    JX.Stratcom.listen('click', 'document-engine-view-dropdown', onmenu);
    statics.initialized = true;
  }

  if (config && config.controlID) {
    var control = JX.$(config.controlID);
    var data = JX.Stratcom.getData(control);

    switch (config.next) {
      case 'render':
        onview(data, null, true);
        break;
      case 'blame':
        blame(data);
        break;
    }
  }

});
