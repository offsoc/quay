import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartVoronoiContainer,
} from '@patternfly/react-charts';
import {getAggregateLogs} from 'src/hooks/UseUsageLogs';

import {useQuery} from '@tanstack/react-query';
import RequestError from 'src/components/errors/RequestError';
import {Flex, FlexItem, Spinner} from '@patternfly/react-core';
import {logKinds} from './UsageLogs';

interface UsageLogsGraphProps {
  starttime: string;
  endtime: string;
  repo: string;
  org: string;
  type: string;
}

export default function UsageLogsGraph(props: UsageLogsGraphProps) {
  const {
    data: aggregateLogs,
    isError: errorFetchingLogs,
    isLoading: loadingAggregateLogs,
  } = useQuery(
    [
      'usageLogs',
      props.starttime,
      props.endtime,
      {org: props.org, repo: props.repo ? props.repo : 'isOrg', type: 'chart'},
    ],
    () => {
      return getAggregateLogs(
        props.org,
        props.repo,
        props.starttime,
        props.endtime,
      );
    },
  );

  if (loadingAggregateLogs) return <Spinner />;
  if (errorFetchingLogs) return <RequestError message="Unable to get logs" />;

  let maxRange = 0;

  function createDataSet() {
    const logData = {};
    if (aggregateLogs) {
      aggregateLogs.forEach((log) => {
        logData[log.kind] = logData[log.kind] || [];
        logData[log.kind].push({
          name: logKinds[log.kind],
          x: new Date(log.datetime),
          y: log.count,
        });
        if (log.count > maxRange) maxRange = log.count;
      });
      return logData;
    }
  }

  const logData = createDataSet();

  function getLegendData() {
    const legends = [];
    const logKeys = Object.keys(logData);
    logKeys.forEach((key) => {
      if (logKinds[key]) {
        legends.push({name: logKinds[key]});
      }
    });
    return legends;
  }

  return (
    <Flex grow={{default: 'grow'}}>
      <FlexItem>
        <Chart
          key={props.starttime + props.endtime}
          containerComponent={
            <ChartVoronoiContainer
              labels={({datum}) => `${datum.name}: ${datum.y}`}
              constrainToVisibleArea
            />
          }
          domain={{
            x: [new Date(props.starttime), new Date(props.endtime)],
            y: [0, maxRange],
          }}
          legendOrientation={
            getLegendData().length >= 12 ? 'horizontal' : 'vertical'
          }
          legendPosition={getLegendData().length >= 12 ? 'bottom' : 'right'}
          legendData={getLegendData()}
          legendAllowWrap
          name="usage-logs-graph"
          padding={{
            bottom: 10 * getLegendData().length,
            left: 80,
            right: 500, // Adjusted to accommodate legend
            top: 50,
          }}
          domainPadding={{x: 5 * Object.keys(logData).length}}
          height={400}
          width={1250}
          scale={{x: 'time', y: 'linear'}}
        >
          <ChartAxis fixLabelOverlap />
          <ChartAxis dependentAxis showGrid />
          <ChartGroup offset={11}>
            {Object.keys(logData).map((logKind, index) => (
              <ChartBar data={logData[logKind]} key={index} />
            ))}
          </ChartGroup>
        </Chart>
      </FlexItem>
    </Flex>
  );
}
