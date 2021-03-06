function AuditDataFactory() {
    this.orderList = [
        ['asc', 'asc'],
        ['asc', 'desc'],
        ['desc', 'asc'],
        ['desc', 'desc']
    ];
    this.aggregatorList = ['average', 'median'];
}

AuditDataFactory.prototype = _.extend({}, Backbone.Events, {
    constructor: AuditDataFactory,

    get: function (numbers, drawSize, drawsPerWeek, draws) {
        var self = this, data = [], weeksPerYear = 52;

        // notify subscribers that audit data building has started
        this.trigger('started', {
            count: 2280
        });

        // expose parameters to protected methods
        this.numbers = numbers;
        this.drawSize = drawSize;
        this.drawsPerWeek = drawsPerWeek;
        this.draws = draws;

        // use 6 months for now
        this.iterations = (weeksPerYear * this.drawsPerWeek) / 2;

        // add elapse time trend data
        _.each(this.orderList, function (orders) {
            _.each(self.aggregatorList, function (aggregation) {
                var config, options, i;

                for (i = 150; i <= 250; i++) {
                    config = {
                        elapseTimeTrend: {
                            drawsPerPeriod: i,
                            hitAggregation: aggregation,
                            elapseTimeOrder: orders[0],
                            gapDistanceOrder: orders[1]
                        }
                    };
                    options = [orders[0], orders[1], aggregation];
                    data.push(self.getAuditData('getElapseTimeTrendGaps', 1, i, options, config));
                }
            });
        });

        // add hot-cold trend data
        _.each(this.orderList, function (orders) {
            var config, i;

            for (i = 5; i <= 20; i++) {
                config = {
                    hotColdTrend: {
                        periodCount: 12,
                        drawsPerPeriod: i,
                        risingOrder: orders[0],
                        hotOrder: orders[1]
                    }
                };
                data.push(self.getAuditData('getHotColdTrend', 12, i, orders, config));
            }
        });

        // add mixed rising elapse time gaps
        _.each(this.orderList, function (orders) {
            _.each(self.aggregatorList, function (aggregation) {
                var config, options, i, j;

                for (i = 5; i <= 20; i++) {
                    for (j = 15; j <= 25; j++) {
                        config = {
                            elapseTimeTrend: {
                                drawsPerPeriod: j * 10,
                                hitAggregation: aggregation,
                                gapDistanceOrder: orders[0]
                            },
                            hotColdTrend: {
                                periodCount: 12,
                                drawsPerPeriod: i,
                                risingOrder: orders[1]
                            }
                        };
                        options = [orders[0], orders[1], aggregation];
                        data.push(self.getAuditData(
                            'getMixedRisingElapseTimeGaps', '12/1', i + '/' + (j * 10), options, config
                        ));
                    }
                }
            });
        });

        return data;
    },

    getAuditData: function (algorithm, periodCount, drawsPerPeriod, options, suggestionsConfig) {
        var currentIteration = 1, lastDraw, suggestion, auditData;

        auditData = new AuditData(
            new Date(),
            this.drawSize,
            algorithm,
            periodCount,
            drawsPerPeriod,
            options,
            suggestionsConfig
        );
        while (currentIteration <= this.iterations) {
            lastDraw = this.draws[this.draws.length - currentIteration];
            suggestion = new AnalyserSuggestions(
                this.numbers,
                this.draws.slice(0, currentIteration * -1),
                this.drawSize,
                suggestionsConfig
            )[algorithm]();

            // update audit data
            auditData.check(suggestion, lastDraw);

            // increase iteration counters
            currentIteration++;
        }
        auditData.calculateScore();

        // throw an event saying that a single audit was finished
        this.trigger('processed');

        return auditData;
    }
});