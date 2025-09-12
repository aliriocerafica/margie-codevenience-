import useSWR from 'swr';

const fetcher = async (url: string | URL | Request) => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }
    return response.json();
};

export function useAgent() {
    const { data, error, isLoading } = useSWR(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/dashboard`, fetcher);

    return {
        data,
        error,
        isLoading
    };
}
