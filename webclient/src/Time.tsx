import React, { useEffect } from 'react';
import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

const TIME_SUBSCRIPTION = gql`subscription {
    timer(interval: 1000) {
        local
    }
}`;

const TIME_QUERY = gql`{
    time {
        local
    }
}`;

interface Time {
    local: string,
}

export const Time = () => {
    const {subscribeToMore, loading, data} = useQuery<{time: Time}>(TIME_QUERY);

    useEffect(() => {
        subscribeToMore({
            document: TIME_SUBSCRIPTION,
            updateQuery: (prev, { subscriptionData}) => {
                if (subscriptionData.data) {
                    let data = subscriptionData.data as unknown as {timer: Time};
                    return {
                        time: data.timer
                    };
                } else {
                    return prev;
                }
            }
        });
    }, []);

    return (
        <div> {loading ? 'Loading' : data!.time.local} </div>
    );
};