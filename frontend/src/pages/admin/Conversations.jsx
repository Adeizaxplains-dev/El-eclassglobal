import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Archive,
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Inbox,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  User,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  addMessage,
  closeConversation,
  getConversation,
  listConversations,
  processConversationWithAI,
  reopenConversation,
  resolveConversation,
} from '../../services/conversationService.js';

import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'All conversations' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_BADGE_VARIANTS = {
  open: 'success',
  resolved: 'gold',
  closed: 'neutral',
};

function unwrapResponse(response) {
  if (!response) return null;

  if (
    response.data !== undefined &&
    response.data !== null
  ) {
    return response.data;
  }

  return response;
}

function extractList(response) {
  const payload = unwrapResponse(response);

  if (Array.isArray(payload)) {
    return {
      items: payload,
      pagination: null,
    };
  }

  if (!payload || typeof payload !== 'object') {
    return {
      items: [],
      pagination: null,
    };
  }

  const items =
    payload.conversations ||
    payload.items ||
    payload.results ||
    payload.data ||
    [];

  const pagination =
    payload.pagination ||
    payload.meta ||
    null;

  return {
    items: Array.isArray(items) ? items : [],
    pagination,
  };
}

function extractConversation(response) {
  const payload = unwrapResponse(response);

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  return (
    payload.conversation ||
    payload.data ||
    payload
  );
}

function getId(conversation) {
  return (
    conversation?._id ||
    conversation?.id ||
    conversation?.conversationId ||
    ''
  );
}

function getCustomer(conversation) {
  return (
    conversation?.customer ||
    conversation?.user ||
    conversation?.contact ||
    {}
  );
}

function getCustomerName(conversation) {
  const customer = getCustomer(conversation);

  return (
    conversation?.customerName ||
    customer?.name ||
    customer?.fullName ||
    customer?.firstName ||
    conversation?.name ||
    'Customer'
  );
}

function getCustomerPhone(conversation) {
  const customer = getCustomer(conversation);

  return (
    conversation?.customerPhone ||
    customer?.phone ||
    customer?.phoneNumber ||
    conversation?.phone ||
    ''
  );
}

function getSubject(conversation) {
  return (
    conversation?.subject ||
    conversation?.title ||
    conversation?.lastMessage?.text ||
    conversation?.lastMessage?.content ||
    'Conversation'
  );
}

function getLastMessage(conversation) {
  const message =
    conversation?.lastMessage ||
    conversation?.messages?.[
      conversation.messages.length - 1
    ];

  if (!message) return '';

  return (
    message?.text ||
    message?.content ||
    message?.body ||
    ''
  );
}

function getStatus(conversation) {
  return String(
    conversation?.status ||
      conversation?.state ||
      'open'
  ).toLowerCase();
}

function getChannel(conversation) {
  return String(
    conversation?.channel ||
      conversation?.source ||
      'whatsapp'
  ).toLowerCase();
}

function getDateValue(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function formatDate(value) {
  const date = getDateValue(value);

  if (!date) return '';

  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatTime(value) {
  const date = getDateValue(value);

  if (!date) return '';

  return new Intl.DateTimeFormat('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function normalizeMessages(conversation) {
  return Array.isArray(conversation?.messages)
    ? conversation.messages
    : [];
}

function getMessageText(message) {
  return (
    message?.text ||
    message?.content ||
    message?.body ||
    ''
  );
}

function isCustomerMessage(message) {
  const sender = String(
    message?.senderType ||
      message?.sender ||
      message?.role ||
      message?.from ||
      ''
  ).toLowerCase();

  return [
    'customer',
    'user',
    'client',
    'incoming',
  ].includes(sender);
}

function getMessageTime(message) {
  return (
    message?.createdAt ||
    message?.timestamp ||
    message?.sentAt ||
    message?.date
  );
}

function getStatusVariant(status) {
  return (
    STATUS_BADGE_VARIANTS[status] ||
    'neutral'
  );
}

function ConversationStatusBadge({ status }) {
  return (
    <Badge variant={getStatusVariant(status)}>
      {status}
    </Badge>
  );
}

function ConversationRow({
  conversation,
  selected,
  onClick,
}) {
  const status = getStatus(conversation);
  const customerName =
    getCustomerName(conversation);
  const phone = getCustomerPhone(conversation);
  const lastMessage =
    getLastMessage(conversation);

  const updatedAt =
    conversation?.updatedAt ||
    conversation?.lastMessageAt ||
    conversation?.createdAt;

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full border-b border-gray-100 px-4 py-4 text-left transition',
        selected
          ? 'bg-emerald-50'
          : 'hover:bg-gray-50',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <User className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-medium text-charcoal">
              {customerName}
            </p>

            <span className="shrink-0 text-[11px] text-muted">
              {formatDate(updatedAt)}
            </span>
          </div>

          {phone && (
            <p className="mt-0.5 truncate text-xs text-muted">
              {phone}
            </p>
          )}

          <p className="mt-1 truncate text-sm text-gray-600">
            {lastMessage ||
              getSubject(conversation)}
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] capitalize text-gray-600">
              {getChannel(conversation)}
            </span>

            <ConversationStatusBadge
              status={status}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          {label}
        </span>

        <Icon className="h-5 w-5 text-emerald-600" />
      </div>

      <p className="mt-2 font-display text-2xl font-semibold text-charcoal">
        {value}
      </p>
    </Card>
  );
}

export function Conversations() {
  const [conversations, setConversations] =
    useState([]);

  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState(null);

  const [loading, setLoading] =
    useState(true);

  const [
    loadingConversation,
    setLoadingConversation,
  ] = useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [detailError, setDetailError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [status, setStatus] =
    useState('');

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState(null);

  const [message, setMessage] =
    useState('');

  const [sending, setSending] =
    useState(false);

  const [aiLoading, setAiLoading] =
    useState(false);

  const loadConversations = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError('');

        const params = {
          page,
          limit: PAGE_SIZE,
        };

        if (status) {
          params.status = status;
        }

        if (search.trim()) {
          params.search = search.trim();
        }

        const response =
          await listConversations(params);

        const result =
          extractList(response);

        setConversations(result.items);
        setPagination(result.pagination);
      } catch (err) {
        setError(
          err?.message ||
            'Unable to load conversations.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, search, status]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConversations();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadConversations]);

  const selectConversation =
    async (conversation) => {
      const conversationId =
        getId(conversation);

      if (!conversationId) {
        setSelectedConversation(
          conversation
        );
        return;
      }

      try {
        setLoadingConversation(true);
        setDetailError('');

        const response =
          await getConversation(
            conversationId
          );

        const fullConversation =
          extractConversation(response);

        setSelectedConversation(
          fullConversation || conversation
        );
      } catch (err) {
        setDetailError(
          err?.message ||
            'Unable to load this conversation.'
        );

        setSelectedConversation(
          conversation
        );
      } finally {
        setLoadingConversation(false);
      }
    };

  const refresh = async () => {
    await loadConversations({
      silent: true,
    });

    if (!selectedConversation) {
      return;
    }

    const conversationId =
      getId(selectedConversation);

    if (!conversationId) {
      return;
    }

    try {
      const response =
        await getConversation(
          conversationId
        );

      const updatedConversation =
        extractConversation(response);

      if (updatedConversation) {
        setSelectedConversation(
          updatedConversation
        );
      }
    } catch {
      // Preserve the current detail view.
    }
  };

  const refreshSelectedConversation =
    async (conversationId) => {
      const response =
        await getConversation(
          conversationId
        );

      const updatedConversation =
        extractConversation(response);

      if (updatedConversation) {
        setSelectedConversation(
          updatedConversation
        );
      }
    };

  const handleSendMessage = async (
    event
  ) => {
    event.preventDefault();

    const conversationId =
      getId(selectedConversation);

    const text = message.trim();

    if (!conversationId || !text) {
      return;
    }

    try {
      setSending(true);
      setDetailError('');

      await addMessage(
        conversationId,
        {
          text,
          content: text,
        }
      );

      setMessage('');

      await refreshSelectedConversation(
        conversationId
      );

      await loadConversations({
        silent: true,
      });
    } catch (err) {
      setDetailError(
        err?.message ||
          'Unable to send the message.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    const conversationId =
      getId(selectedConversation);

    if (!conversationId) return;

    try {
      setDetailError('');

      await resolveConversation(
        conversationId
      );

      await refreshSelectedConversation(
        conversationId
      );

      await loadConversations({
        silent: true,
      });
    } catch (err) {
      setDetailError(
        err?.message ||
          'Unable to resolve conversation.'
      );
    }
  };

  const handleReopen = async () => {
    const conversationId =
      getId(selectedConversation);

    if (!conversationId) return;

    try {
      setDetailError('');

      await reopenConversation(
        conversationId
      );

      await refreshSelectedConversation(
        conversationId
      );

      await loadConversations({
        silent: true,
      });
    } catch (err) {
      setDetailError(
        err?.message ||
          'Unable to reopen conversation.'
      );
    }
  };

  const handleClose = async () => {
    const conversationId =
      getId(selectedConversation);

    if (!conversationId) return;

    try {
      setDetailError('');

      await closeConversation(
        conversationId
      );

      await refreshSelectedConversation(
        conversationId
      );

      await loadConversations({
        silent: true,
      });
    } catch (err) {
      setDetailError(
        err?.message ||
          'Unable to close conversation.'
      );
    }
  };

  const handleAI = async () => {
    const conversationId =
      getId(selectedConversation);

    if (!conversationId) return;

    try {
      setAiLoading(true);
      setDetailError('');

      const response =
        await processConversationWithAI(
          conversationId,
          {}
        );

      const aiResult =
        unwrapResponse(response);

      const suggestedMessage =
        aiResult?.message ||
        aiResult?.reply ||
        aiResult?.suggestion ||
        aiResult?.content ||
        aiResult?.data?.message ||
        '';

      if (suggestedMessage) {
        setMessage(
          suggestedMessage
        );
      } else {
        setDetailError(
          'AI processed the conversation, but no suggested reply was returned.'
        );
      }
    } catch (err) {
      setDetailError(
        err?.message ||
          'Unable to process the conversation with AI.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const counts = useMemo(() => {
    return conversations.reduce(
      (result, conversation) => {
        const conversationStatus =
          getStatus(conversation);

        result.total += 1;

        if (
          conversationStatus === 'open'
        ) {
          result.open += 1;
        }

        if (
          conversationStatus === 'resolved'
        ) {
          result.resolved += 1;
        }

        if (
          conversationStatus === 'closed'
        ) {
          result.closed += 1;
        }

        return result;
      },
      {
        total: 0,
        open: 0,
        resolved: 0,
        closed: 0,
      }
    );
  }, [conversations]);

  const messages = normalizeMessages(
    selectedConversation
  );

  const selectedStatus =
    getStatus(selectedConversation);

  const selectedConversationId =
    getId(selectedConversation);

  const canGoPrevious =
    pagination?.hasPrevPage ??
    pagination?.hasPreviousPage ??
    page > 1;

  const canGoNext =
    pagination?.hasNextPage ??
    pagination?.hasNext ??
    (
      pagination?.totalPages
        ? page < pagination.totalPages
        : conversations.length === PAGE_SIZE
    );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/automations"
              className="text-sm text-muted transition hover:text-emerald-700"
            >
              Control Center
            </Link>

            <ChevronRight className="h-4 w-4 text-gray-400" />

            <span className="text-sm text-charcoal">
              Conversations
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            </div>

            <div>
              <h1 className="font-display text-2xl font-semibold text-charcoal">
                Customer Inbox
              </h1>

              <p className="mt-0.5 text-sm text-muted">
                Manage customer conversations,
                replies and follow-up.
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          variant="secondary"
        >
          <RefreshCw
            className={[
              'mr-2 h-4 w-4',
              refreshing
                ? 'animate-spin'
                : '',
            ].join(' ')}
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Conversations"
          value={counts.total}
          icon={Inbox}
        />

        <SummaryCard
          label="Open"
          value={counts.open}
          icon={MessageCircle}
        />

        <SummaryCard
          label="Resolved"
          value={counts.resolved}
          icon={Check}
        />

        <SummaryCard
          label="Closed"
          value={counts.closed}
          icon={Archive}
        />
      </div>

      {/* Inbox */}
      <Card className="overflow-hidden">
        <div className="grid min-h-[650px] lg:grid-cols-[360px_1fr]">
          {/* Conversation List */}
          <div className="border-b border-gray-100 lg:border-b-0 lg:border-r">
            <div className="border-b border-gray-100 bg-white p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(
                      event.target.value
                    );
                    setPage(1);
                  }}
                  placeholder="Search conversations..."
                  className="pl-9"
                />
              </div>

              <div className="mt-3">
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(
                      event.target.value
                    );
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-charcoal outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  {STATUS_OPTIONS.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="max-h-[560px] overflow-y-auto">
              {loading ? (
                <div className="flex min-h-[300px] items-center justify-center">
                  <Spinner />
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <X className="h-5 w-5 text-red-500" />
                  </div>

                  <p className="mt-3 text-sm text-red-600">
                    {error}
                  </p>

                  <Button
                    type="button"
                    className="mt-4"
                    onClick={() =>
                      loadConversations()
                    }
                  >
                    Try again
                  </Button>
                </div>
              ) : conversations.length ===
                0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                    <MessageCircle className="h-6 w-6 text-gray-300" />
                  </div>

                  <p className="mt-3 font-medium text-charcoal">
                    No conversations found
                  </p>

                  <p className="mt-1 max-w-xs text-sm text-muted">
                    Customer conversations will
                    appear here when available.
                  </p>
                </div>
              ) : (
                conversations.map(
                  (conversation) => (
                    <ConversationRow
                      key={
                        getId(conversation) ||
                        `${getCustomerName(
                          conversation
                        )}-${getCustomerPhone(
                          conversation
                        )}`
                      }
                      conversation={
                        conversation
                      }
                      selected={
                        getId(conversation) ===
                        selectedConversationId
                      }
                      onClick={() =>
                        selectConversation(
                          conversation
                        )
                      }
                    />
                  )
                )
              )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() =>
                  setPage((current) =>
                    Math.max(
                      1,
                      current - 1
                    )
                  )
                }
                className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-xs text-muted">
                Page {page}
              </span>

              <button
                type="button"
                disabled={!canGoNext}
                onClick={() =>
                  setPage(
                    (current) =>
                      current + 1
                  )
                }
                className="inline-flex items-center gap-1 text-sm text-muted transition hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Conversation Detail */}
          <div className="flex min-w-0 flex-col">
            {!selectedConversation ? (
              <div className="flex min-h-[650px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                  <MessageCircle className="h-8 w-8 text-emerald-600" />
                </div>

                <h2 className="mt-4 font-display text-lg font-semibold text-charcoal">
                  Select a conversation
                </h2>

                <p className="mt-1 max-w-sm text-sm leading-6 text-muted">
                  Select a customer conversation
                  from the inbox to view the message
                  history and respond.
                </p>
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="border-b border-gray-100 bg-white px-5 py-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <User className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="truncate font-semibold text-charcoal">
                            {getCustomerName(
                              selectedConversation
                            )}
                          </h2>

                          <ConversationStatusBadge
                            status={
                              selectedStatus
                            }
                          />
                        </div>

                        <p className="mt-0.5 truncate text-sm text-muted">
                          {getCustomerPhone(
                            selectedConversation
                          ) ||
                            getChannel(
                              selectedConversation
                            )}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedStatus ===
                        'open' && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={
                            handleResolve
                          }
                        >
                          <Check className="mr-1.5 h-4 w-4" />
                          Resolve
                        </Button>
                      )}

                      {selectedStatus ===
                        'resolved' && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={
                            handleReopen
                          }
                        >
                          <RefreshCw className="mr-1.5 h-4 w-4" />
                          Reopen
                        </Button>
                      )}

                      {selectedStatus !==
                        'closed' && (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleClose}
                        >
                          <X className="mr-1.5 h-4 w-4" />
                          Close
                        </Button>
                      )}
                    </div>
                  </div>

                  {detailError && (
                    <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">
                      {detailError}
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div className="relative flex-1 overflow-y-auto bg-gray-50 px-4 py-6 sm:px-5">
                  {loadingConversation ? (
                    <div className="flex h-full min-h-[400px] items-center justify-center">
                      <Spinner />
                    </div>
                  ) : messages.length ===
                    0 ? (
                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                        <MessageCircle className="h-6 w-6 text-gray-300" />
                      </div>

                      <p className="mt-3 text-sm font-medium text-charcoal">
                        No messages yet
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        Start the conversation
                        by sending a reply.
                      </p>
                    </div>
                  ) : (
                    <div className="mx-auto max-w-3xl space-y-4">
                      {messages.map(
                        (item, index) => {
                          const customerMessage =
                            isCustomerMessage(
                              item
                            );

                          const text =
                            getMessageText(
                              item
                            );

                          return (
                            <div
                              key={
                                item?._id ||
                                item?.id ||
                                `${index}-${text}`
                              }
                              className={[
                                'flex',
                                customerMessage
                                  ? 'justify-start'
                                  : 'justify-end',
                              ].join(' ')}
                            >
                              <div
                                className={[
                                  'max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%]',
                                  customerMessage
                                    ? 'rounded-tl-sm bg-white text-charcoal'
                                    : 'rounded-tr-sm bg-emerald-600 text-white',
                                ].join(' ')}
                              >
                                <p className="whitespace-pre-wrap break-words text-sm leading-6">
                                  {text ||
                                    'Message'}
                                </p>

                                <div
                                  className={[
                                    'mt-1 flex items-center gap-1 text-[10px]',
                                    customerMessage
                                      ? 'text-gray-400'
                                      : 'text-emerald-100',
                                  ].join(' ')}
                                >
                                  <Clock3 className="h-3 w-3" />

                                  {formatTime(
                                    getMessageTime(
                                      item
                                    )
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>

                {/* Composer */}
                <div className="border-t border-gray-100 bg-white p-4">
                  <form
                    onSubmit={
                      handleSendMessage
                    }
                    className="mx-auto max-w-3xl"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Reply
                        </span>

                        <button
                          type="button"
                          onClick={handleAI}
                          disabled={
                            aiLoading ||
                            selectedStatus ===
                              'closed'
                          }
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 transition hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Bot
                            className={[
                              'h-4 w-4',
                              aiLoading
                                ? 'animate-pulse'
                                : '',
                            ].join(' ')}
                          />

                          {aiLoading
                            ? 'Generating...'
                            : 'AI suggestion'}
                        </button>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                        <textarea
                          value={message}
                          onChange={(event) =>
                            setMessage(
                              event.target
                                .value
                            )
                          }
                          disabled={
                            sending ||
                            selectedStatus ===
                              'closed'
                          }
                          rows={3}
                          placeholder={
                            selectedStatus ===
                            'closed'
                              ? 'This conversation is closed.'
                              : 'Type your reply...'
                          }
                          className="min-h-[84px] flex-1 resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-charcoal outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                        />

                        <Button
                          type="submit"
                          disabled={
                            sending ||
                            !message.trim() ||
                            selectedStatus ===
                              'closed'
                          }
                          className="sm:mb-0.5"
                        >
                          <Send className="mr-1.5 h-4 w-4" />

                          {sending
                            ? 'Sending...'
                            : 'Send'}
                        </Button>
                      </div>

                      {selectedStatus ===
                        'closed' && (
                        <p className="text-xs text-muted">
                          Reopen this conversation
                          before sending a new
                          reply.
                        </p>
                      )}
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Conversations;
