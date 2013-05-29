ns.ViewCollection = function() {};

no.inherit(ns.ViewCollection, ns.View);

ns.ViewCollection.define = function(id, info) {
	return ns.View.define(id, info, this);
};

ns.ViewCollection.prototype._createModels = function() {
	var model_id = this.info.models[0];

	if (1 !== this.info.models.length || !model_id || !ns.Model.info(model_id).isCollection) {
		throw new Error("[ns.ViewCollection] '" + this.id + "' must depend only on one model collection");
	}

	this.models = {};
	this.models[model_id] = ns.Model.create(model_id, this.params);
};

ns.ViewCollection.prototype._init = function() {
	ns.View.prototype._init.apply(this, arguments);

	if (!this.info.split || !this.info.split.view_id) {
		throw new Error("[ns.ViewCollection] '" + this.id + "' must have item view id defined");
	}
};

ns.ViewCollection.prototype.getRequestViews = function(updated, pageLayout, params) {
	this._getRequestViews(updated, pageLayout, params);
    return updated;
};

ns.ViewCollection.prototype._getUpdateTree = function(tree, layout, params) {
    // Добавим в layout представление массива элементов ViewCollection
    if (!layout[this.info.split.view_id]) {
        layout[this.info.split.view_id] = {
            views: {}
        };
    }

    return ns.View.prototype._getUpdateTree.apply(this, arguments);
};

ns.ViewCollection.prototype._getDescendantViewsTree = function(layout, params) {
    var tree = {
        views: {}
    };

    // Для каждого элемента модели-коллекции
    $.each(this.models[this.info.models[0]].models, function(i, model) {
        // создадим собственный view
        var view = this._addView(
            this.info.split.view_id,
            no.extend({}, this.params, model.params)
        );

        // Если нет, создадим веточку в дереве
        if (!tree.views[this.info.split.view_id]) {
            tree.views[this.info.split.view_id] = [];
        }

        // Добавим в дерево декларацию вида
        tree.views[this.info.split.view_id].push(view._getViewTree(layout, params));
    }.bind(this));

    return tree;
};

ns.ViewCollection.prototype._getView = function(key) {
    return this.views && this.views[key] || null;
};

ns.ViewCollection.prototype._addView = function(id, params) {
    var key = ns.View.getKey(id, params);

    var view = this._getView(key);
    if (!view) {
        view = ns.View.create(id, params);
        this.views[view.key] = view;
    }

    return view;
};

ns.ViewCollection.prototype._apply = function(callback) {
    var views = this.views;
    for (var id in views) {
        for (var i = 0; i < views[id].length; i++) {
            callback(views[id][i], id);
        }
    }
};