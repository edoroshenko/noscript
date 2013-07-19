describe('ns.ViewCollection', function() {

    describe('ns.ViewCollection.define', function() {

        beforeEach(function() {
            sinon.spy(ns.ViewCollection, 'define');

            ns.Model.define('model');
            ns.Model.define('model-collection1', {isCollection: true});
            ns.Model.define('model-collection2', {isCollection: true});
        });

        afterEach(function() {
            ns.ViewCollection.define.restore();
        });

        it('should throw exception if I define viewCollection without models', function() {
            try {
                ns.ViewCollection.define('collection');
            } catch(e) {}

            expect(ns.ViewCollection.define.getCall(0).threw()).to.be.ok();
        });

        it('should throw exception if I define viewCollection without ModelCollection', function() {
            try {
                ns.ViewCollection.define('collection', {
                    models: [ 'model' ]
                });
            } catch(e) {}

            expect(ns.ViewCollection.define.getCall(0).threw()).to.be.ok();
        });

        it('should throw exception if I define viewCollection with several ModelCollections', function() {
            try {
                ns.ViewCollection.define('collection', {
                    models: [ 'model-collection1', 'model-collection2' ]
                });
            } catch(e) {}

            expect(ns.ViewCollection.define.getCall(0).threw()).to.be.ok();
        });

        it('should throw exception if I define viewCollection with single ModelCollection but without split.view_id', function() {
            try {
                ns.ViewCollection.define('collection', {
                    models: [ 'model-collection1' ]
                });
            } catch(e) {}

            expect(ns.ViewCollection.define.getCall(0).threw()).to.be.ok();
        });

        it('should not throw exception if I define viewCollection with single ModelCollection and split.view_id', function() {
            try {
                ns.ViewCollection.define('collection', {
                    models: [ 'model-collection1' ],
                    split: {
                        view_id: 'collection-item'
                    }
                });
            } catch(e) {}

            expect(ns.ViewCollection.define.getCall(0).threw()).to.not.be.ok();
        });

    });

    describe('redraw ViewCollection within parent view', function() {

        beforeEach(function(finish) {

            // define models
            ns.Model.define('m-collection', {
                isCollection: true
            });

            ns.Model.define('m-collection-item', {
                params: {
                    p: null
                }
            });

            this.model = ns.Model.create('m-collection');
            // insert first item
            this.model.setData([
                ns.Model.create('m-collection-item', {p: 1}, {data: 1})
            ]);

            ns.Model.define('wrap-model');
            ns.Model.create('wrap-model', {}, {data: true});

            // define views
            ns.View.define('app');
            ns.View.define('wrap', {
                models: ['wrap-model']
            });
            ns.ViewCollection.define('v-collection', {
                models: [ 'm-collection' ],
                split: {
                    view_id: 'v-collection-item'
                }
            });
            ns.View.define('v-collection-item', {
                models: [ 'm-collection-item' ]
            });
            this.APP = ns.View.create('app');

            // define layout
            ns.layout.define('app', {
                'app': {
                    'wrap': {
                        'v-collection': {}
                    }
                }
            });

            // first rewdraw
            var layoutParams = {};
            var layout = ns.layout.page('app', layoutParams);

            new ns.Update(this.APP, layout, layoutParams)
                .start()
                .done(function() {
                    // set fake data to invalidate wrap-view
                    ns.Model.create('wrap-model').set('.fake', 1);

                    // start update to redraw wrap-view
                    new ns.Update(this.APP, layout, layoutParams)
                        .start()
                        .done(function() {
                            finish();
                        });
                }.bind(this));
        });

        it('should have 1 v-collection-item after redraw', function() {
            expect(this.APP.node.getElementsByClassName('ns-view-v-collection')[0].childNodes).to.have.length(1);
        });

    });

    describe('redraw on ModelCollection changes', function() {

        beforeEach(function(finish) {

            // define models
            ns.Model.define('m-collection', {
                isCollection: true
            });

            ns.Model.define('m-collection-item', {
                params: {
                    p: null
                }
            });

            ns.Model.define('m-collection-2', {
                params: {
                    id: null
                },
                split: {
                    model_id: 'm-collection-2',
                    items: '.data',
                    params: {
                        id: '.id'
                    }
                }
            });

            // define views
            ns.View.define('app');
            ns.ViewCollection.define('v-collection', {
                models: [ 'm-collection' ],
                split: {
                    view_id: 'v-collection-item'
                }
            });
            ns.View.define('v-collection-item', {
                models: [ 'm-collection-item' ]
            });

            // recursive view
            ns.ViewCollection.define('v-collection-2', {
                models: [ 'm-collection-2' ],
                split: {
                    view_id: 'v-collection-2'
                },
                events: {
                    'ns-view-init': 'oninit'
                },
                methods: {
                    oninit: function() {
                        this.views || (this.views = {});
                    }
                }
            });

            // define layout
            ns.layout.define('app', {
                'app': {
                    'v-collection': {}
                }
            });

            ns.layout.define('app-2', {
                'app': {
                    'v-collection-2': {}
                }
            });

            finish();
        });

        describe('insert new model-item', function() {

            beforeEach(function(finish) {
                this.model = ns.Model.create('m-collection');
                // insert first item
                this.model.setData([
                    ns.Model.create('m-collection-item', {p: 1}, {data: 1})
                ]);

                this.APP = ns.View.create('app');

                // first rewdraw
                var layout = ns.layout.page('app', {});
                new ns.Update(this.APP, layout, {})
                    .start()
                    .done(function() {
                        this.collectionViewNode1 = this.APP.node.getElementsByClassName('ns-view-v-collection')[0];

                        // insert another model-item in collection
                        this.model.insert([ns.Model.create('m-collection-item', {p: 2})]);

                        // start update to redraw views
                        var layout = ns.layout.page('app', {});
                        new ns.Update(this.APP, layout, {})
                            .start()
                            .done(function() {
                                finish();
                            });
                    }.bind(this));
            });

            afterEach(function() {
                delete this.APP;
                delete this.collectionViewNode1;
                delete this.model;
            });

            it('should create view-collection node', function() {
                expect(this.collectionViewNode1).to.be.an(Node);
            });

            it('view-collection node should be the same after second update', function() {
                expect(this.collectionViewNode1).to.be(
                    this.APP.node.getElementsByClassName('ns-view-v-collection')[0]
                );
            });

            it('should add v-collection-item when I insert model-item in collection', function() {
                expect(this.collectionViewNode1.childNodes).to.have.length(2);
            });

        });

        describe('change in the root model of ModelCollection', function() {
            beforeEach(function(finish) {
                var model = ns.Model.create('m-collection');
                // insert first item
                model.setData([
                    ns.Model.create('m-collection-item', {p: 1}, {data: 1}),
                    ns.Model.create('m-collection-item', {p: 2}, {data: 2})
                ]);

                this.APP = ns.View.create('app');

                // first rewdraw
                var layout = ns.layout.page('app', {});
                new ns.Update(this.APP, layout, {})
                    .start()
                    .done(function() {
                        this.items = this.APP.views["v-collection"].views;

                        this.nodeOld = this.APP.views["v-collection"].node;

                        this.nodeOld.setAttribute('foo', 'bar');

                        this.nodeItem1Old = this.items["view=v-collection-item&p=1"].node;
                        this.nodeItem2Old = this.items["view=v-collection-item&p=2"].node;

                        // touching model after a small timeout to guarantee, that
                        // model and view will have different timeout attribute
                        window.setTimeout(function() {
                            model.touch();

                            // start update to redraw a core view
                            var layout = ns.layout.page('app', {});
                            new ns.Update(this.APP, layout, {})
                                .start()
                                .done(function() {
                                    finish();
                                });
                        }.bind(this), 10);
                    }.bind(this));
            });

            afterEach(function() {
                delete this.APP;
                delete this.nodeOld;
                delete this.nodeItem1Old;
                delete this.nodeItem2Old;
            });

            it('should have the another node of root view', function() {
                expect(this.APP.views["v-collection"].node).not.to.be(this.nodeOld);
            });

            it('should have the same nodes of view-items', function() {
                var node1new = this.APP.views["v-collection"].views["view=v-collection-item&p=1"].node;
                var node2new = this.APP.views["v-collection"].views["view=v-collection-item&p=2"].node;

                expect(node1new).to.be(this.nodeItem1Old);
                expect(node2new).to.be(this.nodeItem2Old);
            });

        });

        describe('update of recursive view collections', function() {

            beforeEach(function(finish) {
                this.model = ns.Model.create('m-collection-2', {id: '0'}, {
                    data: [{
                        data: [],
                        title: '1',
                        id: '1'
                    }, {
                        data: [],
                        title: '2',
                        id: '2'
                    }],
                    title: '0'
                });

                this.APP = ns.View.create('app');

                // first rewdraw
                var layout = ns.layout.page('app-2');
                new ns.Update(this.APP, layout, {id: '0'})
                    .start()
                    .done(function() {
                        this.collectionViewNode = this.APP.node.getElementsByClassName('ns-view-v-collection-2')[0];

                        // Load subcollection data.
                        ns.Model.get('m-collection-2', {id: '1'}).setData({
                            data: [
                                {
                                    data: [{
                                        data: [],
                                        title: '1.1.1',
                                        id: '1.1.1'
                                    }],
                                    title: '1.1',
                                    id: '1.1'
                                },
                                {
                                    data: [],
                                    title: '1.2',
                                    id: '1.2'
                                }
                            ],
                            title: '1',
                            id: '1'
                        });

                        // start update to redraw views
                        var layout = ns.layout.page('app-2');
                        new ns.Update(this.APP, layout, {id: '0'})
                            .start()
                            .done(function() {
                                // Skip this update loop.

                                var layout = ns.layout.page('app-2');
                                new ns.Update(this.APP, layout, {id: '0'})
                                    .start()
                                    .done(function() {
                                        // Edit subcollection later on.
                                        ns.Model.get('m-collection-2', {id: '1'}).set('.title', '1-edit');

                                        var layout = ns.layout.page('app-2');
                                        new ns.Update(this.APP, layout, {id: '0'})
                                            .start()
                                            .done(function() {
                                                finish();
                                            });
                                    }.bind(this));
                            }.bind(this));
                    }.bind(this));
            });

            it('should correctly update nested nodes', function() {
                expect(this.collectionViewNode.childNodes).to.have.length(2);
                expect(this.collectionViewNode.firstChild.childNodes).to.have.length(2);
                expect(this.collectionViewNode.firstChild.firstChild.childNodes).to.have.length(1);
                expect(this.collectionViewNode.lastChild.childNodes).to.have.length(0);
            });

        });

    });

});
